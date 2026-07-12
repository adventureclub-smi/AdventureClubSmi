import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Please login first." }, { status: 401 });
  }

  const { id: trekId } = await params;

  const trek = await prisma.trek.findUnique({ where: { id: trekId } });

  if (!trek) {
    return NextResponse.json({ message: "Trek not found." }, { status: 404 });
  }

  try {
    await prisma.trekNotifyRequest.create({
      data: { trekId, userId: user.id },
    });

    return NextResponse.json({ message: "You'll be emailed as soon as registrations open." });
  } catch (error) {
    const isDuplicate =
      error instanceof Error && "code" in error && (error as { code?: string }).code === "P2002";

    if (isDuplicate) {
      return NextResponse.json({ message: "You're already on the notify list." });
    }

    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
