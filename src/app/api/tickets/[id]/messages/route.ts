/**
 * POST /api/tickets/[id]/messages — Add a message (public reply or internal note)
 *
 * INC-0304: Customers can ONLY send PUBLIC_REPLY. INTERNAL_NOTE from customer = 403.
 */
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, badRequest, forbidden } from "@/lib/api-helpers";
import { createAuditLog } from "@/lib/audit";
import { MessageType } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const { content, type } = body;

  if (!content || !type) return badRequest("content and type are required");

  const msgType = type as MessageType;

  // INC-0304: Customers CANNOT send internal notes
  if (user.role === "CUSTOMER" && msgType === "INTERNAL_NOTE") {
    return forbidden("Customers cannot create internal notes");
  }

  if (!["PUBLIC_REPLY", "INTERNAL_NOTE"].includes(msgType)) {
    return badRequest("type must be PUBLIC_REPLY or INTERNAL_NOTE");
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  // Customers can only message their own tickets
  if (user.role === "CUSTOMER" && ticket.createdById !== user.id) {
    return forbidden("You can only message your own tickets");
  }

  // Cannot message closed/auto-closed tickets
  if (["CLOSED", "AUTO_CLOSED"].includes(ticket.status)) {
    return badRequest("Cannot add messages to a " + ticket.status + " ticket");
  }

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      senderId: user.id,
      type: msgType,
      content,
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
  });

  // Track first response from an agent (for SLA)
  if (
    user.role !== "CUSTOMER" &&
    msgType === "PUBLIC_REPLY" &&
    !ticket.firstResponseAt
  ) {
    await prisma.ticket.update({
      where: { id },
      data: { firstResponseAt: new Date() },
    });
  }

  // If customer replies while WAITING_ON_CUSTOMER → auto-transition to IN_PROGRESS
  if (user.role === "CUSTOMER" && ticket.status === "WAITING_ON_CUSTOMER") {
    const now = new Date();
    const pausedMs = ticket.slaPausedAt
      ? now.getTime() - ticket.slaPausedAt.getTime()
      : 0;
    const pausedMin = Math.floor(pausedMs / 60000);

    await prisma.ticket.update({
      where: { id },
      data: {
        status: "IN_PROGRESS",
        slaPausedMinutes: ticket.slaPausedMinutes + pausedMin,
        slaPausedAt: null,
        waitingOnCustomerSince: null,
        version: { increment: 1 },
      },
    });

    await createAuditLog({
      ticketId: id,
      actorId: user.id,
      action: "STATUS_CHANGE",
      oldValue: "WAITING_ON_CUSTOMER",
      newValue: "IN_PROGRESS",
    });
  }

  // If customer replies to RESOLVED ticket within 7 days → reopen
  if (user.role === "CUSTOMER" && ticket.status === "RESOLVED" && ticket.resolvedAt) {
    const daysSince = (Date.now() - ticket.resolvedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 7) {
      await prisma.ticket.update({
        where: { id },
        data: {
          status: "REOPENED",
          resolvedAt: null,
          version: { increment: 1 },
        },
      });

      await createAuditLog({
        ticketId: id,
        actorId: user.id,
        action: "STATUS_CHANGE",
        oldValue: "RESOLVED",
        newValue: "REOPENED",
      });
    }
  }

  await createAuditLog({
    ticketId: id,
    actorId: user.id,
    action: "MESSAGE_SENT",
    newValue: msgType,
  });

  return NextResponse.json(message, { status: 201 });
}
