import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { isRecruitmentOpenFor } from "@/lib/recruitment-visibility";

// Auth is optional here on purpose — the public homepage's recruitment
// banner needs to call this for anonymous visitors too (an anonymous
// visitor still gets a correct isOpen: they just can never pass the
// isTest whitelist check, same as a logged-in non-whitelisted student).
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = token ? verifyToken(token) : null;

  const settings = await prisma.recruitmentSettings.findFirst();

  const isOpen = isRecruitmentOpenFor(settings, payload);

  return NextResponse.json({
    opensAt: settings?.opensAt ?? null,
    closesAt: settings?.closesAt ?? null,
    interviewDayOptions: settings?.interviewDayOptions ?? [],
    isOpen,
    loggedIn: !!payload,
  });
}
