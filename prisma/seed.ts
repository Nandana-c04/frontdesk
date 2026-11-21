/**
 * Seed script — populates the database with test users, tickets, and holidays
 */
import { PrismaClient, Priority, TicketStatus, MessageType, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.user.deleteMany();

  // --- Users ---
  const admin = await prisma.user.create({
    data: { name: "Meera Krishnan", email: "meera@arvo.io", role: Role.ADMIN },
  });
  const agent1 = await prisma.user.create({
    data: { name: "Ravi Kumar", email: "ravi@arvo.io", role: Role.AGENT },
  });
  const agent2 = await prisma.user.create({
    data: { name: "Sneha Nair", email: "sneha@arvo.io", role: Role.AGENT },
  });
  const agent3 = await prisma.user.create({
    data: { name: "Arun Menon", email: "arun@arvo.io", role: Role.AGENT },
  });
  const cust1 = await prisma.user.create({
    data: { name: "Priya Sharma", email: "priya@client.com", role: Role.CUSTOMER },
  });
  const cust2 = await prisma.user.create({
    data: { name: "Vikram Patel", email: "vikram@client.com", role: Role.CUSTOMER },
  });
  const cust3 = await prisma.user.create({
    data: { name: "Anita Das", email: "anita@client.com", role: Role.CUSTOMER },
  });

  // --- Holidays (2026 Indian holidays sample) ---
  const holidays = [
    { date: new Date("2026-01-26"), name: "Republic Day" },
    { date: new Date("2026-08-15"), name: "Independence Day" },
    { date: new Date("2026-10-02"), name: "Gandhi Jayanti" },
    { date: new Date("2026-11-25"), name: "Diwali" },
    { date: new Date("2026-12-25"), name: "Christmas" },
  ];
  for (const h of holidays) {
    await prisma.holiday.create({ data: h });
  }

  // --- Tickets ---
  const now = new Date();
  const hourMs = 3600000;

  // Ticket 1: HIGH priority, OPEN, unassigned (SLA ticking)
  const t1 = await prisma.ticket.create({
    data: {
      title: "Production server down — cannot access dashboard",
      description: "The main dashboard at app.clientco.com returns 502 for all users since 2 PM. Entire team is blocked.",
      priority: Priority.HIGH,
      status: TicketStatus.OPEN,
      createdById: cust1.id,
      slaReplyDeadline: new Date(now.getTime() + 2 * hourMs),
      slaResolveDeadline: new Date(now.getTime() + 9 * hourMs),
      createdAt: new Date(now.getTime() - 0.5 * hourMs),
    },
  });

  // Ticket 2: MEDIUM priority, IN_PROGRESS, assigned to Ravi
  const t2 = await prisma.ticket.create({
    data: {
      title: "Report export generates blank PDF",
      description: "When exporting the monthly sales report, the PDF file is 0 bytes. Tried Chrome and Firefox.",
      priority: Priority.MEDIUM,
      status: TicketStatus.IN_PROGRESS,
      createdById: cust2.id,
      assignedToId: agent1.id,
      slaReplyDeadline: new Date(now.getTime() + 4 * hourMs),
      slaResolveDeadline: new Date(now.getTime() + 24 * hourMs),
      firstResponseAt: new Date(now.getTime() - 1 * hourMs),
      createdAt: new Date(now.getTime() - 3 * hourMs),
    },
  });

  // Ticket 3: LOW priority, WAITING_ON_CUSTOMER
  const t3 = await prisma.ticket.create({
    data: {
      title: "How to change notification preferences?",
      description: "I want to turn off email notifications for low-priority updates. Where is the setting?",
      priority: Priority.LOW,
      status: TicketStatus.WAITING_ON_CUSTOMER,
      createdById: cust3.id,
      assignedToId: agent2.id,
      slaReplyDeadline: new Date(now.getTime() + 8 * hourMs),
      slaResolveDeadline: new Date(now.getTime() + 40 * hourMs),
      firstResponseAt: new Date(now.getTime() - 2 * hourMs),
      slaPausedAt: new Date(now.getTime() - 1 * hourMs),
      waitingOnCustomerSince: new Date(now.getTime() - 1 * hourMs),
      createdAt: new Date(now.getTime() - 5 * hourMs),
    },
  });

  // Ticket 4: HIGH priority, RESOLVED (SLA was breached on reply)
  const t4 = await prisma.ticket.create({
    data: {
      title: "Login fails with SSO — urgent client demo tomorrow",
      description: "SSO login returns 'Invalid SAML response'. We have a client demo at 10 AM tomorrow.",
      priority: Priority.HIGH,
      status: TicketStatus.RESOLVED,
      createdById: cust1.id,
      assignedToId: agent3.id,
      slaReplyDeadline: new Date(now.getTime() - 5 * hourMs), // breached
      slaResolveDeadline: new Date(now.getTime() - 1 * hourMs), // breached
      firstResponseAt: new Date(now.getTime() - 2 * hourMs),
      resolvedAt: new Date(now.getTime() - 0.5 * hourMs),
      createdAt: new Date(now.getTime() - 10 * hourMs),
    },
  });

  // Ticket 5: MEDIUM, OPEN (unassigned)
  const t5 = await prisma.ticket.create({
    data: {
      title: "Data mismatch between dashboard and CSV export",
      description: "The dashboard shows 142 orders for October but the CSV export shows 138. Need reconciliation.",
      priority: Priority.MEDIUM,
      status: TicketStatus.OPEN,
      createdById: cust2.id,
      slaReplyDeadline: new Date(now.getTime() + 3 * hourMs),
      slaResolveDeadline: new Date(now.getTime() + 20 * hourMs),
      createdAt: new Date(now.getTime() - 1.5 * hourMs),
    },
  });

  // Ticket 6: LOW, CLOSED
  const t6 = await prisma.ticket.create({
    data: {
      title: "Request: dark mode support",
      description: "Would love a dark mode option in the dashboard. Eye strain during night shifts.",
      priority: Priority.LOW,
      status: TicketStatus.CLOSED,
      createdById: cust3.id,
      assignedToId: agent1.id,
      firstResponseAt: new Date(now.getTime() - 48 * hourMs),
      resolvedAt: new Date(now.getTime() - 24 * hourMs),
      createdAt: new Date(now.getTime() - 72 * hourMs),
    },
  });

  // --- Messages ---
  await prisma.ticketMessage.createMany({
    data: [
      // Ticket 2 conversation
      { ticketId: t2.id, senderId: cust2.id, type: MessageType.PUBLIC_REPLY, content: "The PDF export is broken again. Attached screenshot of the blank file.", createdAt: new Date(now.getTime() - 3 * hourMs) },
      { ticketId: t2.id, senderId: agent1.id, type: MessageType.PUBLIC_REPLY, content: "Hi Vikram, I can reproduce this. Looking into the report generation service now.", createdAt: new Date(now.getTime() - 1 * hourMs) },
      { ticketId: t2.id, senderId: agent1.id, type: MessageType.INTERNAL_NOTE, content: "Looks like the wkhtmltopdf service crashed after the last deploy. Need to check with DevOps.", createdAt: new Date(now.getTime() - 0.9 * hourMs) },
      // Ticket 3 conversation
      { ticketId: t3.id, senderId: cust3.id, type: MessageType.PUBLIC_REPLY, content: "Where can I change my notification settings?", createdAt: new Date(now.getTime() - 5 * hourMs) },
      { ticketId: t3.id, senderId: agent2.id, type: MessageType.PUBLIC_REPLY, content: "Hi Anita, go to Settings > Notifications > Email Preferences. Can you let me know if you see the toggle there?", createdAt: new Date(now.getTime() - 2 * hourMs) },
      // Ticket 4 conversation
      { ticketId: t4.id, senderId: cust1.id, type: MessageType.PUBLIC_REPLY, content: "SSO is broken! We have a demo tomorrow morning. URGENT.", createdAt: new Date(now.getTime() - 10 * hourMs) },
      { ticketId: t4.id, senderId: agent3.id, type: MessageType.INTERNAL_NOTE, content: "SAML cert expired. Customer's IT team needs to renew it on their IdP. This is NOT on our side.", createdAt: new Date(now.getTime() - 3 * hourMs) },
      { ticketId: t4.id, senderId: agent3.id, type: MessageType.PUBLIC_REPLY, content: "Hi Priya, the issue is an expired SAML certificate on your identity provider. Please ask your IT team to renew the certificate and re-upload it.", createdAt: new Date(now.getTime() - 2 * hourMs) },
    ],
  });

  // --- Audit Logs ---
  await prisma.auditLog.createMany({
    data: [
      { ticketId: t2.id, actorId: agent1.id, action: "CLAIMED", oldValue: null, newValue: agent1.name, createdAt: new Date(now.getTime() - 1.5 * hourMs) },
      { ticketId: t2.id, actorId: agent1.id, action: "STATUS_CHANGE", oldValue: "OPEN", newValue: "IN_PROGRESS", createdAt: new Date(now.getTime() - 1.5 * hourMs) },
      { ticketId: t3.id, actorId: agent2.id, action: "CLAIMED", oldValue: null, newValue: agent2.name, createdAt: new Date(now.getTime() - 2.5 * hourMs) },
      { ticketId: t3.id, actorId: agent2.id, action: "STATUS_CHANGE", oldValue: "OPEN", newValue: "IN_PROGRESS", createdAt: new Date(now.getTime() - 2.5 * hourMs) },
      { ticketId: t3.id, actorId: agent2.id, action: "STATUS_CHANGE", oldValue: "IN_PROGRESS", newValue: "WAITING_ON_CUSTOMER", createdAt: new Date(now.getTime() - 1 * hourMs) },
      { ticketId: t4.id, actorId: agent3.id, action: "CLAIMED", oldValue: null, newValue: agent3.name, createdAt: new Date(now.getTime() - 3 * hourMs) },
      { ticketId: t4.id, actorId: agent3.id, action: "STATUS_CHANGE", oldValue: "OPEN", newValue: "IN_PROGRESS", createdAt: new Date(now.getTime() - 3 * hourMs) },
      { ticketId: t4.id, actorId: agent3.id, action: "STATUS_CHANGE", oldValue: "IN_PROGRESS", newValue: "RESOLVED", createdAt: new Date(now.getTime() - 0.5 * hourMs) },
    ],
  });

  console.log("✅ Seeded successfully!");
  console.log(`   Users: ${await prisma.user.count()}`);
  console.log(`   Tickets: ${await prisma.ticket.count()}`);
  console.log(`   Messages: ${await prisma.ticketMessage.count()}`);
  console.log(`   Audit Logs: ${await prisma.auditLog.count()}`);
  console.log(`   Holidays: ${await prisma.holiday.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
