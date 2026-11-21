/**
 * GET  /api/tickets       — List tickets (filtered by query params)
 * POST /api/tickets       — Create a new ticket
 */
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, badRequest, forbidden } from "@/lib/api-helpers";
import { calculateSlaDeadlines } from "@/lib/sla";
import { getHolidaySet } from "@/lib/holidays";
import { createAuditLog } from "@/lib/audit";
import { Priority, TicketStatus, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as TicketStatus | null;
  const priority = searchParams.get("priority") as Priority | null;
  const assignedToMe = searchParams.get("assignedToMe") === "true";
  const unassigned = searchParams.get("unassigned") === "true";
  const overdue = searchParams.get("overdue") === "true";

  const where: Prisma.TicketWhereInput = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assignedToMe) where.assignedToId = user.id;
  if (unassigned) where.assignedToId = null;

  // For customers, only show their own tickets
  if (user.role === "CUSTOMER") {
    where.createdById = user.id;
  }

  let tickets = await prisma.ticket.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { messages: true } },
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
  });

  // Filter overdue tickets in-memory (SLA breach check)
  if (overdue) {
    const now = new Date();
    tickets = tickets.filter(
      (t) =>
        (t.slaReplyDeadline && now > t.slaReplyDeadline && !t.firstResponseAt) ||
        (t.slaResolveDeadline && now > t.slaResolveDeadline && !t.resolvedAt)
    );
  }

  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  if (user.role !== "CUSTOMER" && user.role !== "ADMIN") {
    return forbidden("Only customers or admins can create tickets");
  }

  const body = await req.json();
  const { title, description, priority } = body;

  if (!title || !description) {
    return badRequest("title and description are required");
  }

  const prio: Priority = (["LOW", "MEDIUM", "HIGH"].includes(priority) ? priority : "MEDIUM") as Priority;

  const holidays = await getHolidaySet();
  const now = new Date();
  const { replyDeadline, resolveDeadline } = calculateSlaDeadlines(now, prio, holidays);

  const ticket = await prisma.ticket.create({
    data: {
      title,
      description,
      priority: prio,
      createdById: user.id,
      slaReplyDeadline: replyDeadline,
      slaResolveDeadline: resolveDeadline,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  await createAuditLog({
    ticketId: ticket.id,
    actorId: user.id,
    action: "CREATED",
    newValue: `Priority: ${prio}`,
  });

  return NextResponse.json(ticket, { status: 201 });
}
