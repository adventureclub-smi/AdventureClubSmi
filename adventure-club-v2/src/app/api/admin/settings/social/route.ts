import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const settings = await prisma.socialSettings.findFirst();

  return NextResponse.json(
    settings || { instagram: "", linkedin: "", email: "", phone: "", whatsapp: "" }
  );
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { instagram, linkedin, email, phone, whatsapp } = await req.json();

    const data = {
      instagram: instagram?.trim() || null,
      linkedin: linkedin?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      whatsapp: whatsapp?.trim() || null,
    };

    const existing = await prisma.socialSettings.findFirst();

    const settings = existing
      ? await prisma.socialSettings.update({ where: { id: existing.id }, data })
      : await prisma.socialSettings.create({ data });

    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to save social settings." },
      { status: 500 }
    );
  }
}
