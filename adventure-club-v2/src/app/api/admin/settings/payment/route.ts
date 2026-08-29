import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { ImageProcessingError, uploadBuffer } from "@/lib/storage";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    let settings =
      await prisma.paymentSettings.findFirst();

    if (!settings) {
      settings =
        await prisma.paymentSettings.create({
          data: {
  clubName: "NAVIRA",
  receiverName: "NAVIRA",
  upiId: "example@upi",
},
        });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to load payment settings.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const form = await req.formData();

    const clubName = (form.get("clubName") as string) || "";
    const receiverName = (form.get("receiverName") as string) || "";
    const upiId = (form.get("upiId") as string) || "";
    const supportPhone = (form.get("supportPhone") as string) || "";
    const removeQrImage = form.get("removeQrImage") === "true";
    const qrImageFile = form.get("qrImageFile");

    const existing = await prisma.paymentSettings.findFirst();

    let customQrImageUrl = existing?.customQrImageUrl ?? null;

    if (removeQrImage) {
      customQrImageUrl = null;
    } else if (qrImageFile instanceof File) {
      const bytes = Buffer.from(await qrImageFile.arrayBuffer());
      const uploaded = await uploadBuffer(bytes, qrImageFile.type, {
        folder: "AdventureClub/PaymentQR",
      });
      customQrImageUrl = uploaded.secure_url;
    }

    const data = { clubName, receiverName, upiId, supportPhone, customQrImageUrl };

    if (existing) {
      const updated = await prisma.paymentSettings.update({
        where: { id: existing.id },
        data,
      });

      return NextResponse.json(updated);
    }

    const created = await prisma.paymentSettings.create({ data });

    return NextResponse.json(created);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof ImageProcessingError
            ? error.message
            : "Failed to save payment settings.",
      },
      {
        status: 500,
      }
    );
  }
}
