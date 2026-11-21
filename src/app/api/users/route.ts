/**
 * GET /api/users — List all users (for user-switcher dropdown)
 */
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { role: "asc" },
    select: { id: true, name: true, email: true, role: true },
  });
  return NextResponse.json(users);
}
