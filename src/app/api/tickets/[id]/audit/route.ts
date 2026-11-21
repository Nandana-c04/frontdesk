/**
 * GET /api/tickets/[id]/audit — Get immutable audit trail for a ticket (INC-0318)
 */
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  // Customers should not see the full audit trail
  if (user.role === "CUSTOMER") {
    return forbidden("Audit trail is only available to agents and admins");
  }

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const logs = await prisma.auditLog.findMany({
    where: { ticketId: id },
    include: {
      actor: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(logs);
}
