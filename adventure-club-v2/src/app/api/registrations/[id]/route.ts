import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { updateRegistrationStatus } from "@/lib/registration-status";

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const { status, remarks, paymentDays } = await req.json();

    const registration = await updateRegistrationStatus(id, {
      status,
      remarks,
      paymentDays,
    });

    return NextResponse.json({
      message: "Registration updated successfully.",
      registration,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to update registration.",
      },
      {
        status: 500,
      }
    );
  }
}