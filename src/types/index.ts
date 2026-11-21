/**
 * Types shared between client and server components
 */
import { Role, Priority, TicketStatus, MessageType } from "@prisma/client";

export type UserInfo = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type TicketListItem = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  assignedToId: string | null;
  assignedTo: { id: string; name: string } | null;
  createdById: string;
  createdBy: { id: string; name: string };
  slaReplyDeadline: string | null;
  slaResolveDeadline: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  slaPausedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
};

export type TicketDetail = TicketListItem & {
  messages: MessageItem[];
  auditLogs: AuditLogItem[];
};

export type MessageItem = {
  id: string;
  ticketId: string;
  senderId: string;
  sender: { id: string; name: string; role: Role };
  type: MessageType;
  content: string;
  createdAt: string;
};

export type AuditLogItem = {
  id: string;
  ticketId: string;
  actorId: string;
  actor: { id: string; name: string };
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
};

