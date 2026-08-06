import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { sendBulkEmails, emailShell, escapeHtml } from "@/lib/email";

// Recipient count for the "this will go to N students" line on the compose
// form — a plain count query rather than shipping the whole list to the
// client.
export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const count = await prisma.user.count();

  return NextResponse.json({ count });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!subject || !content) {
    return NextResponse.json(
      { message: "Subject and message are both required." },
      { status: 400 }
    );
  }

  const users = await prisma.user.findMany({
    select: { email: true, fullName: true },
  });

  await sendBulkEmails(
    users.map((user) => ({
      to: user.email,
      subject,
      html: emailShell(`
        <h2 style="color:#008862;">${escapeHtml(subject)}</h2>
        <p>Hi ${escapeHtml(user.fullName.split(" ")[0] || "there")},</p>
        <p style="white-space:pre-wrap;">${escapeHtml(content)}</p>
      `),
    }))
  );

  return NextResponse.json({ message: "Email sent.", count: users.length });
}
