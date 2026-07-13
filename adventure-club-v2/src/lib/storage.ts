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
};

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
    const { data, info } = await sharp(buffer)
      .rotate()
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });

    finalBuffer = data;
    width = info.width;
    height = info.height;
    finalContentType = "image/webp";
    ext = "webp";
  }

  const key = options.key || `${options.folder}/${crypto.randomUUID()}.${ext}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: finalBuffer,
      ContentType: finalContentType,
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
