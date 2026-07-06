import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ message: "Invalid Session" }, { status: 401 });
    }

    const registrations = await prisma.registration.findMany({
      where: {
        userId: payload.id,
        certificateIssued: true,
      },
      include: {
        trek: true,
        certificate: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const certificates = registrations
      .filter((r) => r.trek)
      .map((r) => ({
        registrationId: r.id,
        trekId: r.trek!.id,
        trekTitle: r.trek!.title,
        trekDate: r.trek!.date,
        certificateUrl: r.certificate?.certificateUrl ?? null,
        issuedAt: r.certificate?.issuedAt ?? r.certificateIssuedAt ?? null,
      }));

    return NextResponse.json(certificates);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load certificates." },
      { status: 500 }
    );
  }
}
