/**
 * POST /api/tickets/[id]/claim — Atomic ticket claiming (INC-0291 fix)
 *
 * Uses optimistic locking: UPDATE ... WHERE assignedToId IS NULL AND version = expected
 * Returns 409 Conflict if another agent already claimed it.
 */
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden, conflict } from "@/lib/api-helpers";
import { createAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  if (user.role === "CUSTOMER") return forbidden("Customers cannot claim tickets");

  const { id } = await params;

  // Atomic claim with optimistic locking
  const result = await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({ where: { id } });

    if (!ticket) return { error: "Ticket not found", status: 404 };
    if (ticket.assignedToId) {
      const assignee = await tx.user.findUnique({
        where: { id: ticket.assignedToId },
        select: { name: true },
      });
      return {
        error: `Already claimed by ${assignee?.name ?? "another agent"}`,
        status: 409,
      };
    }
    if (ticket.status !== "OPEN") {
      return { error: `Cannot claim ticket in ${ticket.status} status`, status: 400 };
    }

    // Atomically assign + change status + bump version
    const updated = await tx.ticket.update({
      where: { id, version: ticket.version },
      data: {
        assignedToId: user.id,
        status: "IN_PROGRESS",
        firstResponseAt: null, // will be set when agent sends first reply
        version: { increment: 1 },
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });

    return { ticket: updated };
  });

  if ("error" in result) {
    const status = result.status as number;
    if (status === 409) return conflict(result.error as string);
    return NextResponse.json({ error: result.error }, { status });
  }

  await createAuditLog({
    ticketId: id,
    actorId: user.id,
    action: "CLAIMED",
    newValue: user.name,
  });

  await createAuditLog({
    ticketId: id,
    actorId: user.id,
    action: "STATUS_CHANGE",
    oldValue: "OPEN",
    newValue: "IN_PROGRESS",
  });

  return NextResponse.json(result.ticket);
}
