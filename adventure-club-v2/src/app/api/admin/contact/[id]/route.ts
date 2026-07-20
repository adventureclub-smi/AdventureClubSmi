import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { status, reply } = await req.json();

    const submission = await prisma.contactSubmission.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(reply !== undefined ? { reply, repliedAt: new Date() } : {}),
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Failed to update submission." }, { status: 500 });
  }
}
