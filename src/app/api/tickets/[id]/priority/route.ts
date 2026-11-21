/**
 * PATCH /api/tickets/[id]/priority — Escalate/de-escalate priority with proportional SLA recalculation
 */
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, badRequest, forbidden } from "@/lib/api-helpers";
import { recalculateSlaOnEscalation } from "@/lib/sla";
import { getHolidaySet } from "@/lib/holidays";
import { createAuditLog } from "@/lib/audit";
import { Priority } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  if (user.role === "CUSTOMER") return forbidden("Customers cannot change priority");

  const { id } = await params;
  const body = await req.json();
  const newPriority = body.priority as Priority;

  if (!newPriority || !["LOW", "MEDIUM", "HIGH"].includes(newPriority)) {
    return badRequest("priority must be LOW, MEDIUM, or HIGH");
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  if (ticket.priority === newPriority) {
    return badRequest("Priority is already " + newPriority);
  }

  // Cannot change priority on terminal statuses
  if (["CLOSED", "AUTO_CLOSED", "RESOLVED"].includes(ticket.status)) {
    return badRequest("Cannot change priority of a " + ticket.status + " ticket");
  }

  const now = new Date();
  const holidays = await getHolidaySet();

  // Proportional SLA recalculation
  const updateData: Record<string, unknown> = {
    priority: newPriority,
    version: { increment: 1 },
  };

  if (ticket.slaReplyDeadline && !ticket.firstResponseAt) {
    updateData.slaReplyDeadline = recalculateSlaOnEscalation(
      now,
      ticket.slaReplyDeadline,
      ticket.priority,
      newPriority,
      "replyMinutes",
      ticket.slaPausedMinutes,
      holidays
    );
  }

  if (ticket.slaResolveDeadline && !ticket.resolvedAt) {
    updateData.slaResolveDeadline = recalculateSlaOnEscalation(
      now,
      ticket.slaResolveDeadline,
      ticket.priority,
      newPriority,
      "resolveMinutes",
      ticket.slaPausedMinutes,
      holidays
    );
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
    action: "PRIORITY_CHANGE",
    oldValue: ticket.priority,
    newValue: newPriority,
  });

  return NextResponse.json(updated);
}
