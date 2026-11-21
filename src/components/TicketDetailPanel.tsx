"use client";

import { useState } from "react";
import { TicketDetail, AuditLogItem } from "@/types";
import { useUser } from "@/context/UserContext";

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-indigo-100 text-indigo-800",
  WAITING_ON_CUSTOMER: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-green-100 text-green-800",
  REOPENED: "bg-orange-100 text-orange-800",
  CLOSED: "bg-gray-100 text-gray-600",
  AUTO_CLOSED: "bg-gray-100 text-gray-600",
};

const priorityColors: Record<string, string> = {
  HIGH: "bg-red-100 text-red-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-green-100 text-green-800",
};

function formatDate(s: string) {
  return new Date(s).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatStatus(s: string) {
  return s.replace(/_/g, " ");
}

type Props = {
  ticket: TicketDetail;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onSendMessage: (content: string, type: "PUBLIC_REPLY" | "INTERNAL_NOTE") => void;
  onClaim: () => void;
};

export default function TicketDetailPanel({
  ticket,
  onStatusChange,
  onPriorityChange,
  onSendMessage,
  onClaim,
}: Props) {
  const { currentUser } = useUser();
  const [messageContent, setMessageContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [activeTab, setActiveTab] = useState<"conversation" | "audit">("conversation");

  if (!currentUser) return null;

  const isAgent = currentUser.role === "AGENT" || currentUser.role === "ADMIN";
  const isCustomer = currentUser.role === "CUSTOMER";

  const replyBreached =
    ticket.slaReplyDeadline &&
    !ticket.firstResponseAt &&
    new Date() > new Date(ticket.slaReplyDeadline);
  const resolveBreached =
    ticket.slaResolveDeadline &&
    !ticket.resolvedAt &&
    new Date() > new Date(ticket.slaResolveDeadline);

  const handleSend = () => {
    if (!messageContent.trim()) return;
    onSendMessage(
      messageContent.trim(),
      isInternalNote ? "INTERNAL_NOTE" : "PUBLIC_REPLY"
    );
    setMessageContent("");
  };

  // Determine available status transitions
  const statusActions: { label: string; status: string; color: string }[] = [];
  if (isAgent) {
    if (ticket.status === "OPEN" && !ticket.assignedToId) {
      // Claim button handles this
    }
    if (ticket.status === "IN_PROGRESS") {
      statusActions.push(
        { label: "Wait on Customer", status: "WAITING_ON_CUSTOMER", color: "bg-amber-500 hover:bg-amber-600" },
        { label: "Resolve", status: "RESOLVED", color: "bg-green-500 hover:bg-green-600" }
      );
    }
    if (ticket.status === "REOPENED") {
      statusActions.push(
        { label: "Resume Work", status: "IN_PROGRESS", color: "bg-indigo-500 hover:bg-indigo-600" }
      );
    }
  }
  if (isCustomer) {
    if (ticket.status === "RESOLVED") {
      statusActions.push(
        { label: "Reopen", status: "REOPENED", color: "bg-orange-500 hover:bg-orange-600" }
      );
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{ticket.title}</h2>
            <p className="mt-1 text-sm text-gray-600">{ticket.description}</p>
          </div>
        </div>

        {/* Meta badges */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityColors[ticket.priority]}`}>
            {ticket.priority}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[ticket.status]}`}>
            {formatStatus(ticket.status)}
          </span>
          <span className="text-xs text-gray-500">
            Created by {ticket.createdBy.name} • {formatDate(ticket.createdAt)}
          </span>
          {ticket.assignedTo && (
            <span className="text-xs text-gray-500">
              → Assigned to {ticket.assignedTo.name}
            </span>
          )}
        </div>

        {/* SLA indicators */}
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          {ticket.slaReplyDeadline && (
            <div className={`flex items-center gap-1 ${replyBreached ? "text-red-700 font-bold" : "text-gray-500"}`}>
              {replyBreached ? "⚠" : "⏱"} Reply SLA:{" "}
              {ticket.firstResponseAt
                ? `✅ Responded ${formatDate(ticket.firstResponseAt)}`
                : formatDate(ticket.slaReplyDeadline)}
            </div>
          )}
          {ticket.slaResolveDeadline && (
            <div className={`flex items-center gap-1 ${resolveBreached ? "text-red-700 font-bold" : "text-gray-500"}`}>
              {resolveBreached ? "⚠" : "⏱"} Resolve SLA:{" "}
              {ticket.resolvedAt
                ? `✅ Resolved ${formatDate(ticket.resolvedAt)}`
                : formatDate(ticket.slaResolveDeadline)}
            </div>
          )}
          {ticket.slaPausedAt && (
            <div className="flex items-center gap-1 text-amber-600">
              ⏸ SLA paused (waiting on customer)
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          {isAgent && ticket.status === "OPEN" && !ticket.assignedToId && (
            <button
              onClick={onClaim}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              🤚 Claim Ticket
            </button>
          )}
          {statusActions.map((action) => (
            <button
              key={action.status}
              onClick={() => onStatusChange(action.status)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors ${action.color}`}
            >
              {action.label}
            </button>
          ))}
          {isAgent && !["CLOSED", "AUTO_CLOSED", "RESOLVED"].includes(ticket.status) && (
            <select
              value={ticket.priority}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="LOW">Priority: LOW</option>
              <option value="MEDIUM">Priority: MEDIUM</option>
              <option value="HIGH">Priority: HIGH</option>
            </select>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("conversation")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "conversation"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Conversation ({ticket.messages.length})
        </button>
        {isAgent && (
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "audit"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Audit Trail ({ticket.auditLogs.length})
          </button>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "conversation" ? (
          <div className="space-y-3">
            {ticket.messages.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-8">No messages yet.</p>
            )}
            {ticket.messages.map((msg) => {
              const isInternal = msg.type === "INTERNAL_NOTE";
              const isSelf = msg.senderId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`rounded-lg p-3 ${
                    isInternal
                      ? "border-2 border-yellow-300 bg-yellow-50"
                      : isSelf
                      ? "bg-blue-50 ml-8"
                      : "bg-gray-50 mr-8"
                  }`}
                >
                  {isInternal && (
                    <div className="mb-1 flex items-center gap-1 text-xs font-bold text-yellow-700">
                      🔒 INTERNAL NOTE — Team only
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-medium text-gray-700">
                      {msg.sender.name}
                      <span className="ml-1 font-normal text-gray-400">({msg.sender.role})</span>
                    </span>
                    <span>{formatDate(msg.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <AuditTimeline logs={ticket.auditLogs} />
        )}
      </div>

      {/* Compose area — not shown for closed tickets */}
      {!["CLOSED", "AUTO_CLOSED"].includes(ticket.status) && (
        <div className="border-t border-gray-200 p-4">
          {isAgent && (
            <div className="mb-2 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isInternalNote}
                  onChange={(e) => setIsInternalNote(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className={isInternalNote ? "font-bold text-yellow-700" : "text-gray-600"}>
                  Internal Note
                </span>
              </label>
              {isInternalNote && (
                <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                  ⚠ This will NOT be visible to the customer
                </span>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder={isInternalNote ? "Write an internal note..." : "Write a reply..."}
              className={`flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 resize-none ${
                isInternalNote
                  ? "border-yellow-300 bg-yellow-50 focus:ring-yellow-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend();
              }}
            />
            <button
              onClick={handleSend}
              disabled={!messageContent.trim()}
              className="self-end rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">Ctrl+Enter to send</p>
        </div>
      )}
    </div>
  );
}

function AuditTimeline({ logs }: { logs: AuditLogItem[] }) {
  if (logs.length === 0) {
    return <p className="text-center text-sm text-gray-500 py-8">No audit events yet.</p>;
  }

  const actionIcons: Record<string, string> = {
    CREATED: "🆕",
    CLAIMED: "🤚",
    STATUS_CHANGE: "🔄",
    PRIORITY_CHANGE: "⬆️",
    MESSAGE_SENT: "💬",
  };

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
          <span className="text-lg">{actionIcons[log.action] ?? "📋"}</span>
          <div className="flex-1 text-sm">
            <span className="font-medium text-gray-900">{log.actor.name}</span>{" "}
            <span className="text-gray-600">
              {log.action.toLowerCase().replace(/_/g, " ")}
            </span>
            {log.oldValue && log.newValue && (
              <span className="text-gray-500">
                : {log.oldValue} → {log.newValue}
              </span>
            )}
            {!log.oldValue && log.newValue && (
              <span className="text-gray-500">: {log.newValue}</span>
            )}
          </div>
          <span className="shrink-0 text-xs text-gray-400">{formatDate(log.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}

