import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const EVENT_ID = "6b00b95868ef9bfd919c6242";

async function main() {
  const event = await prisma.trek.findUnique({ where: { id: EVENT_ID } });
  if (!event || event.type !== "EVENT") {
    throw new Error("Demo event not found — did create-demo-tug-of-war.mjs run first?");
  }

  const users = await prisma.user.findMany({
    where: { role: { not: "admin" } },
    take: 24,
    orderBy: { createdAt: "asc" },
  });

  if (users.length < 8) {
    throw new Error(`Only found ${users.length} non-admin users — need more to demo properly.`);
  }

  // Alternate MALE/FEMALE for a clean 50/50 split, so the gender-balancing
  // in the draw has something real to demonstrate.
  const genders = ["MALE", "FEMALE"];

  let created = 0;
  for (let i = 0; i < users.length; i++) {
    const existing = await prisma.eventRegistration.findFirst({
      where: { trekId: EVENT_ID, userId: users[i].id },
    });
    if (existing) continue;

    // Pair up users 0&1, 2&3 as mutual buddy requests, to demo buddy-pairing
    // too — everyone else registers solo.
    const isBuddyPairIndex = i < 4;
    let buddyRequestUserId = null;
    if (isBuddyPairIndex) {
      const partnerIndex = i % 2 === 0 ? i + 1 : i - 1;
      buddyRequestUserId = users[partnerIndex].id;
    }

    await prisma.eventRegistration.create({
      data: {
        trekId: EVENT_ID,
        userId: users[i].id,
        gender: genders[i % 2],
        buddyRequestUserId,
      },
    });
    created++;
  }

  console.log(`Registered ${created} participants (of ${users.length} candidates) for the demo event.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
