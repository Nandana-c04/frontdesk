/**
 * PATCH /api/tickets/[id]/status — Change ticket status (validates state machine)
 */
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, badRequest, forbidden } from "@/lib/api-helpers";
import { canTransition } from "@/lib/state-machine";
import { createAuditLog } from "@/lib/audit";
import { TicketStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const newStatus = body.status as TicketStatus;

  if (!newStatus) return badRequest("status is required");

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  // Customers can only act on their own tickets
  if (user.role === "CUSTOMER" && ticket.createdById !== user.id) {
    return forbidden("You can only modify your own tickets");
  }

  // Validate state machine transition
  if (!canTransition(ticket.status, newStatus, user.role)) {
    return badRequest(
      `Cannot transition from ${ticket.status} to ${newStatus} as ${user.role}`
    );
  }

  // Reopen check: only within 7 calendar days of resolution
  if (newStatus === "REOPENED" && ticket.resolvedAt) {
    const daysSinceResolution =
      (Date.now() - ticket.resolvedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceResolution > 7) {
      return badRequest(
        "Cannot reopen: more than 7 days since resolution. Please create a new ticket."
      );
    }
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    status: newStatus,
    version: { increment: 1 },
  };

  const now = new Date();

  // SLA pause/resume logic
  if (newStatus === "WAITING_ON_CUSTOMER") {
    updateData.slaPausedAt = now;
    updateData.waitingOnCustomerSince = now;
  } else if (
    ticket.status === "WAITING_ON_CUSTOMER" &&
    ticket.slaPausedAt
  ) {
    // Resume: accumulate paused minutes
    const pausedMs = now.getTime() - ticket.slaPausedAt.getTime();
    const pausedMin = Math.floor(pausedMs / 60000);
    updateData.slaPausedMinutes = ticket.slaPausedMinutes + pausedMin;
    updateData.slaPausedAt = null;
    updateData.waitingOnCustomerSince = null;
  }

  if (newStatus === "RESOLVED") {
    updateData.resolvedAt = now;
  }

  if (newStatus === "REOPENED") {
    updateData.resolvedAt = null;
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: updateData,
    include: {
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await createAuditLog({
    ticketId: id,
    actorId: user.id,
    action: "STATUS_CHANGE",
    oldValue: ticket.status,
    newValue: newStatus,
  });

  return NextResponse.json(updated);
}
