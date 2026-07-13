// One-time migration: downloads every Cloudinary-hosted file referenced in
// the database, re-uploads it to R2 (through the same sharp/WebP pipeline
// new uploads use), and rewrites the DB record to the new R2 URL.
//
// Safe to re-run: any field whose value is no longer a Cloudinary URL is
// skipped, so an interrupted run can just be started again.
//
// Usage:
//   node scripts/migrate-cloudinary-to-r2.js --dry-run   (report only, no writes)
//   node scripts/migrate-cloudinary-to-r2.js             (actually migrate)

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");
const crypto = require("crypto");

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");

function isCloudinaryUrl(url) {
  return typeof url === "string" && url.includes("res.cloudinary.com");
}

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

function extensionFromContentType(contentType) {
  const known = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "video/mp4": "mp4",
  };
  return known[contentType] || (contentType || "").split("/")[1] || "bin";
}

// Mirrors src/lib/storage.ts's uploadBuffer, duplicated here so this script
// has no dependency on the Next.js/TS build — it's a one-time throwaway.
async function uploadBuffer(buffer, contentType, { folder, resourceType, key }) {
  let finalBuffer = buffer;
  let finalContentType = contentType;
  let ext = extensionFromContentType(contentType);
  let width, height;

  const isImage = (contentType || "").startsWith("image/") && resourceType !== "video";

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

  const finalKey = key || `${folder}/${crypto.randomUUID()}.${ext}`;

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: finalKey,
      Body: finalBuffer,
      ContentType: finalContentType,
    })
  );

  return { secure_url: `${process.env.R2_PUBLIC_URL}/${finalKey}`, key: finalKey, width, height };
}

async function downloadUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

const stats = { migrated: 0, skipped: 0, failed: 0 };

async function migrateField({ label, url, folder, resourceType, key, onMigrated }) {
  if (!isCloudinaryUrl(url)) {
    stats.skipped++;
    return;
  }

  console.log(`${DRY_RUN ? "[dry-run] would migrate" : "migrating"}: ${label} -> ${url}`);

  if (DRY_RUN) {
    stats.migrated++;
    return;
  }

  try {
    const { buffer, contentType } = await downloadUrl(url);
    const uploaded = await uploadBuffer(buffer, contentType, { folder, resourceType, key });
    await onMigrated(uploaded);
    stats.migrated++;
  } catch (error) {
    stats.failed++;
    console.error(`  FAILED: ${label}:`, error.message);
  }
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN — no data will be changed ===" : "=== LIVE MIGRATION ===");

  // Treks
  const treks = await prisma.trek.findMany({ select: { id: true, title: true, coverImage: true } });
  for (const trek of treks) {
    await migrateField({
      label: `Trek "${trek.title}" coverImage`,
      url: trek.coverImage,
      folder: "AdventureClub/Treks",
      onMigrated: async (u) =>
        prisma.trek.update({ where: { id: trek.id }, data: { coverImage: u.secure_url } }),
    });
  }

  // Trek waypoints (admin-pasted URLs; migrate any that happen to be Cloudinary)
  const waypoints = await prisma.trekWaypoint.findMany({
    select: { id: true, label: true, mediaUrl: true, mediaType: true },
  });
  for (const wp of waypoints) {
    await migrateField({
      label: `Waypoint "${wp.label}" mediaUrl`,
      url: wp.mediaUrl,
      folder: "AdventureClub/Waypoints",
      resourceType: wp.mediaType === "video" ? "video" : "image",
      onMigrated: async (u) =>
        prisma.trekWaypoint.update({ where: { id: wp.id }, data: { mediaUrl: u.secure_url } }),
    });
  }

  // Trek gallery
  const galleryPhotos = await prisma.gallery.findMany({ select: { id: true, imageUrl: true } });
  for (const photo of galleryPhotos) {
    await migrateField({
      label: `Gallery photo ${photo.id}`,
      url: photo.imageUrl,
      folder: "AdventureClub/Treks",
      onMigrated: async (u) =>
        prisma.gallery.update({ where: { id: photo.id }, data: { imageUrl: u.secure_url } }),
    });
  }

  // Homepage gallery
  const homepagePhotos = await prisma.homepageGalleryPhoto.findMany({
    select: { id: true, imageUrl: true },
  });
  for (const photo of homepagePhotos) {
    await migrateField({
      label: `Homepage gallery photo ${photo.id}`,
      url: photo.imageUrl,
      folder: "AdventureClub/HomepageGallery",
      onMigrated: async (u) =>
        prisma.homepageGalleryPhoto.update({ where: { id: photo.id }, data: { imageUrl: u.secure_url } }),
    });
  }

  // Instagram thumbnails
  const posts = await prisma.instagramPost.findMany({ select: { id: true, thumbnailUrl: true } });
  for (const post of posts) {
    await migrateField({
      label: `Instagram post ${post.id} thumbnail`,
      url: post.thumbnailUrl,
      folder: "AdventureClub/Instagram",
      onMigrated: async (u) =>
        prisma.instagramPost.update({ where: { id: post.id }, data: { thumbnailUrl: u.secure_url } }),
    });
  }

  // Certificate signature settings
  const certSettings = await prisma.certificateSettings.findFirst();
  if (certSettings) {
    await migrateField({
      label: "CertificateSettings facultyHeadSignatureUrl",
      url: certSettings.facultyHeadSignatureUrl,
      folder: "AdventureClub/CertificateSignatures",
      onMigrated: async (u) =>
        prisma.certificateSettings.update({
          where: { id: certSettings.id },
          data: { facultyHeadSignatureUrl: u.secure_url },
        }),
    });
    await migrateField({
      label: "CertificateSettings presidentSignatureUrl",
      url: certSettings.presidentSignatureUrl,
      folder: "AdventureClub/CertificateSignatures",
      onMigrated: async (u) =>
        prisma.certificateSettings.update({
          where: { id: certSettings.id },
          data: { presidentSignatureUrl: u.secure_url },
        }),
    });
  }

  // Student dashboard banner
  const dashboardSettings = await prisma.studentDashboardSettings.findFirst();
  if (dashboardSettings) {
    await migrateField({
      label: "StudentDashboardSettings bannerImageUrl",
      url: dashboardSettings.bannerImageUrl,
      folder: "AdventureClub/StudentDashboard",
      onMigrated: async (u) =>
        prisma.studentDashboardSettings.update({
          where: { id: dashboardSettings.id },
          data: { bannerImageUrl: u.secure_url },
        }),
    });
  }

  // Songs (audio + thumbnail)
  const songs = await prisma.song.findMany({
    select: { id: true, title: true, audioUrl: true, thumbnailUrl: true },
  });
  for (const song of songs) {
    await migrateField({
      label: `Song "${song.title}" audio`,
      url: song.audioUrl,
      folder: "AdventureClub/Songs",
      resourceType: "video",
      onMigrated: async (u) =>
        prisma.song.update({ where: { id: song.id }, data: { audioUrl: u.secure_url } }),
    });
    await migrateField({
      label: `Song "${song.title}" thumbnail`,
      url: song.thumbnailUrl,
      folder: "AdventureClub/Songs",
      onMigrated: async (u) =>
        prisma.song.update({ where: { id: song.id }, data: { thumbnailUrl: u.secure_url } }),
    });
  }

  // Homepage stories
  const stories = await prisma.homepageStory.findMany({ select: { id: true, imageUrl: true } });
  for (const story of stories) {
    await migrateField({
      label: `Homepage story ${story.id}`,
      url: story.imageUrl,
      folder: "AdventureClub/Stories",
      onMigrated: async (u) =>
        prisma.homepageStory.update({ where: { id: story.id }, data: { imageUrl: u.secure_url } }),
    });
  }

  // Homepage story scenes (also refresh width/height)
  const scenes = await prisma.homepageStoryScene.findMany({ select: { id: true, imageUrl: true } });
  for (const scene of scenes) {
    await migrateField({
      label: `Story scene ${scene.id}`,
      url: scene.imageUrl,
      folder: "AdventureClub/StoryScenes",
      onMigrated: async (u) =>
        prisma.homepageStoryScene.update({
          where: { id: scene.id },
          data: { imageUrl: u.secure_url, imageWidth: u.width || 0, imageHeight: u.height || 0 },
        }),
    });
  }

  // Tribe members (photo + optional song)
  const tribeMembers = await prisma.tribeMember.findMany({
    select: { id: true, name: true, photoUrl: true, songUrl: true },
  });
  for (const member of tribeMembers) {
    await migrateField({
      label: `Tribe member "${member.name}" photo`,
      url: member.photoUrl,
      folder: "AdventureClub/Tribe",
      onMigrated: async (u) =>
        prisma.tribeMember.update({ where: { id: member.id }, data: { photoUrl: u.secure_url } }),
    });
    await migrateField({
      label: `Tribe member "${member.name}" song`,
      url: member.songUrl,
      folder: "AdventureClub/Tribe",
      resourceType: "video",
      onMigrated: async (u) =>
        prisma.tribeMember.update({ where: { id: member.id }, data: { songUrl: u.secure_url } }),
    });
  }

  // Government IDs
  const users = await prisma.user.findMany({
    where: { govtIdImageUrl: { not: null } },
    select: { id: true, fullName: true, govtIdImageUrl: true },
  });
  for (const user of users) {
    await migrateField({
      label: `User "${user.fullName}" govt ID`,
      url: user.govtIdImageUrl,
      folder: "AdventureClub/GovtIds",
      onMigrated: async (u) =>
        prisma.user.update({ where: { id: user.id }, data: { govtIdImageUrl: u.secure_url } }),
    });
  }

  // Payment proof screenshots (stored in the `notes` field)
  const payments = await prisma.payment.findMany({
    where: { notes: { not: null } },
    select: { id: true, notes: true },
  });
  for (const payment of payments) {
    await migrateField({
      label: `Payment ${payment.id} screenshot`,
      url: payment.notes,
      folder: "payment-proofs",
      onMigrated: async (u) =>
        prisma.payment.update({ where: { id: payment.id }, data: { notes: u.secure_url } }),
    });
  }

  // Certificates (deterministic key so future undo/regenerate targets the
  // same object the live certificate-generation route would use)
  const certificates = await prisma.certificate.findMany({
    select: { id: true, registrationId: true, certificateUrl: true },
  });
  for (const cert of certificates) {
    await migrateField({
      label: `Certificate ${cert.id}`,
      url: cert.certificateUrl,
      folder: "AdventureClub/Certificates",
      key: `AdventureClub/Certificates/${cert.registrationId}-certificate.webp`,
      onMigrated: async (u) =>
        prisma.certificate.update({ where: { id: cert.id }, data: { certificateUrl: u.secure_url } }),
    });
  }

  console.log("\n=== Summary ===");
  console.log(`Migrated: ${stats.migrated}`);
  console.log(`Skipped (already non-Cloudinary): ${stats.skipped}`);
  console.log(`Failed: ${stats.failed}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
