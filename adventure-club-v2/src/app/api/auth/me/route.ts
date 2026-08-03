import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";

// Lightweight session check for client components (like the navbar) that
// need to know "is someone logged in right now" without a full profile
// fetch — the token cookie is httpOnly, so client JS can't just read it
// directly, and this is the cheapest way to ask the server on their behalf.
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ loggedIn: false });
  }

  return NextResponse.json({
    loggedIn: true,
    clubRole: user.clubRole,
  });
}
