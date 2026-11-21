"use client";

import { TicketListItem } from "@/types";
import { useUser } from "@/context/UserContext";

const priorityColors: Record<string, string> = {
  HIGH: "bg-red-100 text-red-800 border-red-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  LOW: "bg-green-100 text-green-800 border-green-200",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-indigo-100 text-indigo-800",
  WAITING_ON_CUSTOMER: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-green-100 text-green-800",
  REOPENED: "bg-orange-100 text-orange-800",
  CLOSED: "bg-gray-100 text-gray-600",
  AUTO_CLOSED: "bg-gray-100 text-gray-600",
};

function formatStatus(s: string) {
  return s.replace(/_/g, " ");
}

function isSlaBreached(deadline: string | null, responseAt: string | null): boolean {
  if (!deadline || responseAt) return false;
  return new Date() > new Date(deadline);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type Props = {
  tickets: TicketListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClaim: (id: string) => void;
};

export default function TicketList({ tickets, selectedId, onSelect, onClaim }: Props) {
  const { currentUser } = useUser();

  if (tickets.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No tickets match the current filters.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {tickets.map((ticket) => {
        const replyBreached = isSlaBreached(ticket.slaReplyDeadline, ticket.firstResponseAt);
        const resolveBreached = isSlaBreached(ticket.slaResolveDeadline, ticket.resolvedAt);
        const isBreached = replyBreached || resolveBreached;
        const isSelected = ticket.id === selectedId;

        return (
          <div
            key={ticket.id}
            onClick={() => onSelect(ticket.id)}
            className={`cursor-pointer px-4 py-3 transition-colors hover:bg-gray-50 ${
              isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
            } ${isBreached ? "border-l-4 border-l-red-500" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      priorityColors[ticket.priority]
                    }`}
                  >
                    {ticket.priority}
                  </span>
                  <h3 className="truncate text-sm font-medium text-gray-900">
                    {ticket.title}
                  </h3>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${statusColors[ticket.status]}`}>
                    {formatStatus(ticket.status)}
                  </span>
                  <span>•</span>
                  <span>{ticket.createdBy.name}</span>
                  <span>•</span>
                  <span>{timeAgo(ticket.createdAt)}</span>
                  {ticket._count.messages > 0 && (
                    <>
                      <span>•</span>
                      <span>💬 {ticket._count.messages}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {ticket.assignedTo ? (
                  <span className="text-xs text-gray-500">
                    → {ticket.assignedTo.name}
                  </span>
                ) : (
                  currentUser?.role !== "CUSTOMER" && ticket.status === "OPEN" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClaim(ticket.id);
                      }}
                      className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      Claim
                    </button>
                  )
                )}
                {isBreached && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 animate-pulse">
                    ⚠ SLA BREACH
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

