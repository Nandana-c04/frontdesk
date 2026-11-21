/**
 * Shared request helpers — extracting "current user" from verified JWT cookies/tokens
 */
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function getCurrentUser(req: NextRequest) {
  const authPayload = await getAuthUserFromRequest(req);
  if (!authPayload) return null;

  return prisma.user.findUnique({
    where: { id: authPayload.id },
  });
}

export function unauthorized(msg = "Unauthorized: Please log in to continue") {
  return NextResponse.json({ error: msg }, { status: 401 });
}

export function forbidden(msg = "Forbidden: You do not have permission to access this resource") {
  return NextResponse.json({ error: msg }, { status: 403 });
}

export function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export function conflict(msg: string) {
  return NextResponse.json({ error: msg }, { status: 409 });
}
