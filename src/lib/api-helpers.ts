/**
 * Shared request helpers — extracting "current user" from headers (simulated auth)
 */
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export function unauthorized() {
  return NextResponse.json({ error: "No user selected. Set x-user-id header." }, { status: 401 });
}

export function forbidden(msg = "Forbidden") {
  return NextResponse.json({ error: msg }, { status: 403 });
}

export function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export function conflict(msg: string) {
  return NextResponse.json({ error: msg }, { status: 409 });
}
