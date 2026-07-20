import crypto from "crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

function getClient() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

function extensionFromContentType(contentType: string) {
  const known: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "video/mp4": "mp4",
  };

  return known[contentType] || contentType.split("/")[1] || "bin";
}

type UploadOptions = {
  folder: string;
  // "video" also covers audio (mirrors the Cloudinary `resource_type: "video"`
  // convention already used in this codebase for songs) — either way, it
  // means "don't run this through sharp."
  resourceType?: "image" | "video";
  // A deterministic key instead of a random one — used where a later
  // operation (e.g. certificate regeneration/deletion) needs to address the
  // exact same object again.
  key?: string;
  // Opt-in target for uploads that come in unusually large (e.g. raw phone
  // photos) — ratchets quality down, then downscales width, until under the
  // limit. Left unset everywhere else, which keeps today's flat quality-80
  // behavior for every other upload path.
  maxSizeKB?: number;
};

// A source photo downscaled to a sane display resolution loses far less
// perceptible detail than that same resolution crushed down to a low WebP
// quality — profile-style photos are never viewed anywhere near their raw
// phone-camera dimensions anyway. So: cap dimensions to a generous display
// size first, then nudge quality down only gently (never below a floor
// where compression artifacts become visible), and only fall back to
// shrinking further if that still isn't enough.
async function compressToTarget(buffer: Buffer, maxBytes: number) {
  const metadata = await sharp(buffer).rotate().metadata();

  let width =
    metadata.width && metadata.width > 1600 ? 1600 : metadata.width;
  let quality = 82;

  let result = await sharp(buffer)
    .rotate()
    .resize({ width })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });

  while (result.data.length > maxBytes && quality > 55) {
    quality -= 8;
    result = await sharp(buffer)
      .rotate()
      .resize({ width })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true });
  }

  while (result.data.length > maxBytes && width && width > 500) {
    width = Math.round(width * 0.85);
    result = await sharp(buffer)
      .rotate()
      .resize({ width })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true });
  }

  return result;
}

// Every upload site-wide funnels through here, so this is the one place that
// needs to cap dimensions — otherwise a raw phone photo or a full-resolution
// desktop screenshot (payment proofs and govt ID uploads are as likely to be
// this large as any admin-facing upload) only gets re-encoded, never resized,
// and stays multi-MB despite the quality-80 pass.
const DEFAULT_MAX_WIDTH = 2000;

// Re-encodes images to WebP at upload time (quality 80) since R2 has no
// on-the-fly transformation like Cloudinary's q_auto,f_auto — this is a
// one-time cost instead of a per-request one, and WebP alone covers the vast
// majority of browsers today.
export async function uploadBuffer(
  buffer: Buffer,
  contentType: string,
  options: UploadOptions
): Promise<{ secure_url: string; key: string; width?: number; height?: number }> {
  let finalBuffer = buffer;
  let finalContentType = contentType;
  let ext = extensionFromContentType(contentType);
  let width: number | undefined;
  let height: number | undefined;

  const isImage = contentType.startsWith("image/") && options.resourceType !== "video";

  if (isImage) {
    let result;

    if (options.maxSizeKB) {
      result = await compressToTarget(buffer, options.maxSizeKB * 1024);
    } else {
      const metadata = await sharp(buffer).rotate().metadata();
      const targetWidth =
        metadata.width && metadata.width > DEFAULT_MAX_WIDTH ? DEFAULT_MAX_WIDTH : metadata.width;

      result = await sharp(buffer)
        .rotate()
        .resize({ width: targetWidth })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });
    }

    finalBuffer = result.data;
    width = result.info.width;
    height = result.info.height;
    finalContentType = "image/webp";
    ext = "webp";
  }

  const key = options.key || `${options.folder}/${crypto.randomUUID()}.${ext}`;

  // Random-UUID keys are permanent once written — nothing ever overwrites
  // them, so browsers/Cloudflare's edge can cache them forever. A caller-
  // supplied deterministic key (e.g. certificate regeneration) can be
  // overwritten at the same URL, so those get a short cache instead —
  // otherwise a regenerated certificate would stay invisible behind a
  // year-old cached copy of the old one.
  const cacheControl = options.key
    ? "public, max-age=300"
    : "public, max-age=31536000, immutable";

  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: finalBuffer,
      ContentType: finalContentType,
      CacheControl: cacheControl,
    })
  );

  return { secure_url: `${process.env.R2_PUBLIC_URL!}/${key}`, key, width, height };
}

// Matches Cloudinary's `uploader.upload(dataUri, {...})` call shape so every
// existing `cloudinary.uploader.upload(base64, {...})` call site only needs
// its function name/import swapped, not its surrounding logic rewritten.
export async function uploadDataUri(dataUri: string, options: UploadOptions) {
  const match = dataUri.match(/^data:([^;]+);base64,([\s\S]*)$/);

  if (!match) {
    throw new Error("Invalid data URI");
  }

  const [, contentType, base64Data] = match;

  return uploadBuffer(Buffer.from(base64Data, "base64"), contentType, options);
}

export async function deleteFromStorage(key: string) {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key })
  );
}
