import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });

  const inOneWeek = new Date();
  inOneWeek.setDate(inOneWeek.getDate() + 7);

  const opensAt = new Date();
  opensAt.setDate(opensAt.getDate() - 1);

  const closesAt = new Date();
  closesAt.setDate(closesAt.getDate() + 5);

  const event = await prisma.trek.create({
    data: {
      type: "EVENT",
      title: "Tug of War",
      destination: "Main Quad, SMI Campus",
      trailType: "Event",
      difficulty: "N/A",
      altitude: "N/A",
      duration: "N/A",
      distance: "N/A",
      trekDay: "N/A",
      date: inOneWeek,
      price: 0,
      installments: 1,
      initialPayment: 0,
      finalPayment: 0,
      seats: 99999,
      description:
        "Grab your friends (or don't — teams are drawn at random!) and pull for glory. Register individually, teams are formed fairly once registration closes.",
      coverImage: null,
      eventTeamSize: 6,
      eventQualifiersCount: 4,
      eventMatchesPerTeamCap: 4,
      eventBalanceGender: true,
      registrationOpensAt: opensAt,
      registrationClosesAt: closesAt,
      distanceKm: 0,
      altitudeMeters: 0,
      campNights: 0,
      countsAsPeak: false,
      isTest: true,
      testVisibleToUserIds: admin ? [admin.id] : [],
      isDraft: true,
    },
  });

  console.log("Created demo event:", event.id, event.title);
  console.log(`Admin manage URL: http://localhost:3000/admin/events/${event.id}`);
  console.log(`Public URL: http://localhost:3000/events/${event.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
