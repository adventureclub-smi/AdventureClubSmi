import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { notifyTrekCreated, notifyWorkshopCreated } from "@/lib/notification-emails";

// The only thing that flips Trek.isDraft to false (see the comment on that
// field in schema.prisma) — and the moment the "New Trek/Workshop
// Announced" email actually goes out, not creation. Lets admins/core team
// sit on a draft for as long as they need (QR code, poster, etc.) before the
// whole club finds out.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { trekId } = await req.json();

    if (!trekId) {
      return NextResponse.json({ message: "trekId is required." }, { status: 400 });
    }

    const existing = await prisma.trek.findUnique({ where: { id: trekId } });

    if (!existing) {
      return NextResponse.json({ message: "Trek not found." }, { status: 404 });
    }

    if (!existing.isDraft) {
      return NextResponse.json({ message: "This is already live." }, { status: 400 });
    }

    const trek = await prisma.trek.update({
      where: { id: trekId },
      data: { isDraft: false },
    });

    // Test treks/workshops are a private dry-run, same as at creation — they
    // never trigger a club-wide announcement email even on Go Live.
    if (!trek.isTest) {
      after(async () => {
        try {
          if (trek.type === "WORKSHOP") {
            await notifyWorkshopCreated(trek);
          } else {
            await notifyTrekCreated(trek);
          }
        } catch (emailError) {
          console.error("Failed to send go-live announcement emails:", emailError);
        }
      });
    }

    return NextResponse.json({
      message: `${trek.type === "WORKSHOP" ? "Workshop" : "Trek"} is now live!`,
      trek,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to go live." }, { status: 500 });
  }
}
