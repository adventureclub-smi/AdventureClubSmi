import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

// For short muted background loops only (Tribe page background, etc.) — not
// a general-purpose video pipeline. Drops audio entirely (never heard on an
// ambient loop), re-encodes at a fairly aggressive CRF, and caps width to
// 1280px, since the result is stretched full-bleed behind other content
// rather than viewed at native detail. Runs against temp files because
// fluent-ffmpeg/ffmpeg need real paths, not buffers, on either end.
export async function compressVideo(buffer: Buffer): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const id = crypto.randomUUID();
  const inputPath = path.join(tmpDir, `${id}-in`);
  const outputPath = path.join(tmpDir, `${id}-out.mp4`);

  await fs.writeFile(inputPath, buffer);

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .noAudio()
        .videoCodec("libx264")
        .outputOptions([
          "-crf 28",
          "-preset veryfast",
          "-vf",
          "scale='min(1280,iw)':-2",
          "-movflags",
          "+faststart",
        ])
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .save(outputPath);
    });

    return await fs.readFile(outputPath);
  } finally {
    await Promise.all([
      fs.unlink(inputPath).catch(() => {}),
      fs.unlink(outputPath).catch(() => {}),
    ]);
  }
}
