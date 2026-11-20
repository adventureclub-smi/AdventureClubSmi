import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

async function main() {
  const client = new MongoClient(process.env.DATABASE_URL);
  await client.connect();
  const db = client.db();

  const treks = db.collection("Trek");
  const regs = db.collection("EventRegistration");

  const events = await treks.find({ type: "EVENT" }, { projection: { _id: 1 } }).toArray();

  for (const event of events) {
    const registrations = await regs
      .find({ trekId: event._id })
      .sort({ createdAt: 1 })
      .toArray();

    let n = 0;
    for (const reg of registrations) {
      n++;
      if (reg.shortCode) continue;
      await regs.updateOne(
        { _id: reg._id },
        {
          $set: {
            shortCode: String(n).padStart(2, "0"),
            attendanceMarked: false,
            attendanceMarkedAt: null,
            attendanceMarkedBy: null,
          },
        }
      );
    }
    console.log(`Backfilled ${registrations.length} registrations for event ${event._id}.`);
  }

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
