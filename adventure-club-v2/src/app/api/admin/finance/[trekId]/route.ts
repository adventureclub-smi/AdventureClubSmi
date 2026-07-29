import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { computeTrekFinance } from "@/lib/trek-finance";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trekId: string }> }
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { trekId } = await params;

    const finance = await computeTrekFinance(trekId);

    return NextResponse.json(finance);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load finance data." },
      { status: 500 }
    );
  }
}
