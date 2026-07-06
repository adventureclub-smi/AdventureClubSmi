import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {

const admin = await requireAdmin();

if (!admin) {
  return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
}

const users=await prisma.user.findMany({

orderBy:{
createdAt:"desc"
}

});

return NextResponse.json(users);

}