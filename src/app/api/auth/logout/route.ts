/**
 * GET  /api/auth/me     — Get active authenticated user profile
 * POST /api/auth/logout — Invalidate session and clear auth cookie
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api-helpers";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  
  // Explicitly expire the cookie across all paths
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  });

  return response;
}

