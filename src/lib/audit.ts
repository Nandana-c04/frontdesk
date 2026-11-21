/**
 * Audit log helper — creates immutable event records
 */
import { prisma } from "./prisma";

export async function createAuditLog(params: {
  ticketId: string;
  actorId: string;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
}) {
  return prisma.auditLog.create({
    data: {
      ticketId: params.ticketId,
      actorId: params.actorId,
      action: params.action,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
    },
  });
}
