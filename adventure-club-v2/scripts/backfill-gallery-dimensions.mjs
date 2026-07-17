// One-time backfill: existing HomepageGalleryPhoto rows predate width/height
// tracking, so the /gallery masonry grid fell back to a uniform 4:5 ratio
// for all of them. Reads each photo's real dimensions (local /public files
// or remote R2 URLs) so the grid shows genuine landscape/portrait variety
// instead of a forced uniform shape.
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function getDimensions(imageUrl) {
  if (imageUrl.startsWith("http")) {
    const res = await fetch(imageUrl);
    const buffer = Buffer.from(await res.arrayBuffer());
    return sharp(buffer).metadata();
  }

  const filePath = path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
  const buffer = fs.readFileSync(filePath);
  return sharp(buffer).metadata();
}

async function main() {
  // Not filtering by width/height null here — pre-existing documents from
  // before this field existed have it entirely absent rather than set to
  // null, and Mongo/Prisma null-equality filters don't match absent fields
  // (same quirk hit earlier this session with registrationOpenNotifiedAt).
  const photos = await prisma.homepageGalleryPhoto.findMany();

  console.log(`Backfilling ${photos.length} photo(s)...`);

  for (const photo of photos) {
    try {
      const { width, height } = await getDimensions(photo.imageUrl);

      await prisma.homepageGalleryPhoto.update({
        where: { id: photo.id },
        data: { width, height },
      });

      console.log(`${photo.imageUrl}: ${width}x${height}`);
    } catch (err) {
      console.error(`FAILED for ${photo.imageUrl}:`, err.message);
    }
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
