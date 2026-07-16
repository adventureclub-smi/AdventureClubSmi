// One-time seed for the admin-editable "Things We Do" homepage section —
// uploads the original 7 activity images to R2 and creates matching
// HomepageActivity rows, so production doesn't regress to an empty section
// now that this content moved from a hardcoded array to the database.
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const prisma = new PrismaClient();

function getClient() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function uploadImage(localPath, folder) {
  const buffer = fs.readFileSync(localPath);

  const { data, info } = await sharp(buffer)
    .rotate()
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });

  const key = `${folder}/${crypto.randomUUID()}.webp`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: data,
      ContentType: "image/webp",
    })
  );

  console.log(`  uploaded ${path.basename(localPath)} -> ${key} (${info.width}x${info.height})`);

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

const ACTIVITIES = [
  {
    icon: "mountain",
    title: "Trekking",
    description: "Conquer breathtaking peaks and unforgettable trails with the Adventure Club.",
    localImage: "public/images/activities/trekking.jpg",
    highlights: ["Sunrise Views", "Weekend Adventures", "Beginner Friendly", "Experienced Leaders"],
    difficulty: "Moderate",
    bestSeason: "Oct – Feb",
    duration: "1–2 Days",
    funFact: "Our highest trek climbs over 2,600m above sea level.",
    buttonText: "Explore Treks",
    buttonLink: "/treks",
  },
  {
    icon: "tent",
    title: "Camping",
    description: "Pitch your tent under open skies and wake up to the wild.",
    localImage: "public/images/activities/camping.jpg",
    highlights: ["Starlit Nights", "Tent Setup Skills", "Group Bonding", "Off-Grid Escape"],
    difficulty: "Easy",
    bestSeason: "Sep – Mar",
    duration: "1 Night",
    funFact: "Some of our best friendships were made over a shared tent pole.",
    buttonText: "See Upcoming Camps",
    buttonLink: "/treks",
  },
  {
    icon: "flame",
    title: "Bonfire",
    description: "Gather around the fire after an unforgettable adventure.",
    localImage: "public/images/activities/bonfire.jpg",
    highlights: ["Music", "Stories", "Night Sky", "Camping Experience"],
    funFact: "No trek officially ends until the last log burns out.",
    buttonText: "Join The Circle",
    buttonLink: "/signup",
  },
  {
    icon: "sailboat",
    title: "Kayaking",
    description: "Experience calm lakes and exciting waters.",
    localImage: "public/images/activities/kayaking.jpg",
    highlights: ["Beginner Lessons", "Safety Gear Included", "Team Paddling", "Scenic Routes"],
    difficulty: "Easy – Moderate",
    bestSeason: "Jun – Sep",
    duration: "Half Day",
    buttonText: "Explore Water Adventures",
    buttonLink: "/treks",
  },
  {
    icon: "tree-pine",
    title: "Forest Trails",
    description: "Where the road ends, the story begins — lose yourself in the green.",
    localImage: "public/images/activities/trail-running.jpg",
    highlights: ["Shaded Canopies", "Wildlife Spotting", "Quiet Trails", "Fresh Air Reset"],
    duration: "2–4 Hours",
    buttonText: "Discover Trails",
    buttonLink: "/treks",
  },
  {
    icon: "footprints",
    title: "Bouldering",
    description: "Test your grip, your grit, and your nerve on raw rock.",
    localImage: "public/images/activities/bouldering.jpg",
    highlights: ["No Experience Needed", "Certified Instructors", "Crash Pads Provided", "Real Rock, Real Rush"],
    difficulty: "Beginner to Advanced",
    buttonText: "Try Bouldering",
    buttonLink: "/treks",
  },
  {
    icon: "camera",
    title: "Photography",
    description: "Chase the light, frame the wild, and take the mountains home with you.",
    localImage: "public/images/activities/photography.jpg",
    highlights: ["Golden Hour Shoots", "Landscape Tips", "Gear Advice Welcome", "Shared Reels"],
    funFact: "Half our Instagram feed comes from members, not professionals.",
    buttonText: "See The Shots",
    buttonLink: "#gallery",
  },
];

async function main() {
  const existing = await prisma.homepageActivity.count();

  if (existing > 0) {
    console.log(`HomepageActivity already has ${existing} row(s) — skipping seed.`);
    return;
  }

  console.log(`Seeding ${ACTIVITIES.length} activities...`);

  for (let i = 0; i < ACTIVITIES.length; i++) {
    const { localImage, ...rest } = ACTIVITIES[i];

    const imageUrl = await uploadImage(localImage, "AdventureClub/Activities");

    await prisma.homepageActivity.create({
      data: {
        ...rest,
        imageUrl,
        order: i,
      },
    });

    console.log(`created: ${rest.title}`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
