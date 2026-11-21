/**
 * Ticket State Machine — validates allowed transitions
 */
import { TicketStatus, Role } from "@prisma/client";

type TransitionRule = {
  to: TicketStatus;
  allowedRoles: Role[];
};

const TRANSITIONS: Record<TicketStatus, TransitionRule[]> = {
  OPEN: [
    { to: "IN_PROGRESS", allowedRoles: ["AGENT", "ADMIN"] },
  ],
  IN_PROGRESS: [
    { to: "WAITING_ON_CUSTOMER", allowedRoles: ["AGENT", "ADMIN"] },
    { to: "RESOLVED", allowedRoles: ["AGENT", "ADMIN"] },
  ],
  WAITING_ON_CUSTOMER: [
    { to: "IN_PROGRESS", allowedRoles: ["AGENT", "ADMIN", "CUSTOMER"] },
    { to: "AUTO_CLOSED", allowedRoles: ["ADMIN"] }, // system-triggered
  ],
  RESOLVED: [
    { to: "REOPENED", allowedRoles: ["CUSTOMER"] },
    { to: "CLOSED", allowedRoles: ["ADMIN"] }, // system-triggered after 7 days
  ],
  REOPENED: [
    { to: "IN_PROGRESS", allowedRoles: ["AGENT", "ADMIN"] },
  ],
  CLOSED: [],
  AUTO_CLOSED: [],
};

export function canTransition(
  from: TicketStatus,
  to: TicketStatus,
  role: Role
): boolean {
  const rules = TRANSITIONS[from];
  if (!rules) return false;
  return rules.some((r) => r.to === to && r.allowedRoles.includes(role));
}

export function getAllowedTransitions(
  from: TicketStatus,
  role: Role
): TicketStatus[] {
  const rules = TRANSITIONS[from] ?? [];
  return rules.filter((r) => r.allowedRoles.includes(role)).map((r) => r.to);
}
