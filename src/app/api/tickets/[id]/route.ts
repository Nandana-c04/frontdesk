/**
 * GET /api/tickets/[id] — Get ticket detail with messages (role-filtered)
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

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      messages: {
        where:
          user.role === "CUSTOMER"
            ? { type: "PUBLIC_REPLY" } // INC-0304: customers NEVER see internal notes
            : {},
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      auditLogs: {
        include: {
          actor: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Customers can only view their own tickets
  if (user.role === "CUSTOMER" && ticket.createdById !== user.id) {
    return forbidden("You can only view your own tickets");
  }

  return NextResponse.json(ticket);
}
