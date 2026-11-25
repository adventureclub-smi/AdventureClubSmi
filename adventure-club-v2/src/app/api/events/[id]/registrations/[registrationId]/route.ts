import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type RouteContext = { params: Promise<{ id: string; registrationId: string }> };

// Removes a single registration — a mistaken sign-up, a duplicate, someone
// who asked to be taken off the list. For a club member this also frees
// them up to register again from their own dashboard, since "already
// registered" there is just a lookup for a row that no longer exists.
export async function DELETE(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: eventId, registrationId } = await context.params;

    const registration = await prisma.eventRegistration.findUnique({ where: { id: registrationId } });

    if (!registration || registration.trekId !== eventId) {
      return NextResponse.json({ message: "Registration not found." }, { status: 404 });
    }

    await prisma.eventRegistration.delete({ where: { id: registrationId } });

    return NextResponse.json({ message: "Registration deleted." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}

// Corrects gender and/or toggles the admin's "core member" pick for one
// registration — for whoever skipped the field at sign-up, was entered
// wrong, or needs to be seeded evenly across teams at draw time. Both
// fields are optional in the body; only the ones present are updated.
export async function PATCH(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id: eventId, registrationId } = await context.params;
    const body = await req.json();

    const registration = await prisma.eventRegistration.findUnique({ where: { id: registrationId } });

    if (!registration || registration.trekId !== eventId) {
      return NextResponse.json({ message: "Registration not found." }, { status: 404 });
    }

    const data: { gender?: string; isCoreMember?: boolean } = {};
    if (typeof body.gender === "string" && body.gender.trim()) data.gender = body.gender.trim();
    if (typeof body.isCoreMember === "boolean") data.isCoreMember = body.isCoreMember;

    const updated = await prisma.eventRegistration.update({ where: { id: registrationId }, data });

    return NextResponse.json({ message: "Updated.", registration: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
