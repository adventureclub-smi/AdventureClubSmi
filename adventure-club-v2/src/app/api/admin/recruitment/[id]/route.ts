import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { notifyRecruitmentDecision } from "@/lib/notification-emails";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.recruitmentApplication.delete({ where: { id } });

  return NextResponse.json({ message: "Application deleted." });
}

// Records the accept/reject decision and, in the same call, emails the
// applicant to tell them — a single admin action covers both, matching
// how this is actually used (there's no reason to record a decision and
// not tell the person).
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { decisionStatus, message, team } = await req.json();

  if (decisionStatus !== "ACCEPTED" && decisionStatus !== "REJECTED") {
    return NextResponse.json(
      { message: "decisionStatus must be ACCEPTED or REJECTED." },
      { status: 400 }
    );
  }

  if (decisionStatus === "ACCEPTED" && !team?.trim()) {
    return NextResponse.json(
      { message: "Pick which team they're joining before sending the acceptance email." },
      { status: 400 }
    );
  }

  const application = await prisma.recruitmentApplication.update({
    where: { id },
    data: {
      decisionStatus,
      decisionEmailSentAt: new Date(),
    },
    include: {
      user: { select: { email: true, fullName: true } },
    },
  });

  try {
    await notifyRecruitmentDecision(application.user, decisionStatus === "ACCEPTED", {
      team: typeof team === "string" ? team : undefined,
      message: typeof message === "string" ? message : undefined,
    });
  } catch (emailError) {
    console.error("Failed to send recruitment decision email:", emailError);
    return NextResponse.json(
      {
        message: "Decision saved, but the email failed to send. You can resend it from the same button.",
        application,
      },
      { status: 207 }
    );
  }

  return NextResponse.json(application);
}
