"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { TicketListItem, TicketDetail } from "@/types";
import TicketList from "@/components/TicketList";
import TicketDetailPanel from "@/components/TicketDetailPanel";
import CreateTicketModal from "@/components/CreateTicketModal";

type Filter = {
  status: string;
  priority: string;
  assignedToMe: boolean;
  unassigned: boolean;
  overdue: boolean;
};

export default function Dashboard() {
  const { currentUser } = useUser();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>({
    status: "",
    priority: "",
    assignedToMe: false,
    unassigned: false,
    overdue: false,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTickets = useCallback(async () => {
    if (!currentUser) return;
    const params = new URLSearchParams();
    if (filter.status) params.set("status", filter.status);
    if (filter.priority) params.set("priority", filter.priority);
    if (filter.assignedToMe) params.set("assignedToMe", "true");
    if (filter.unassigned) params.set("unassigned", "true");
    if (filter.overdue) params.set("overdue", "true");

    const res = await fetch(`/api/tickets?${params}`, {
      headers: { "x-user-id": currentUser.id },
    });
    if (res.ok) {
      const data = await res.json();
      setTickets(data);
    }
    setLoading(false);
  }, [currentUser, filter]);

  const fetchTicketDetail = useCallback(
    async (id: string) => {
      if (!currentUser) return;
      const res = await fetch(`/api/tickets/${id}`, {
        headers: { "x-user-id": currentUser.id },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (selectedId) fetchTicketDetail(selectedId);
  }, [selectedId, fetchTicketDetail]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleClaim = async (id: string) => {
    if (!currentUser) return;
    const res = await fetch(`/api/tickets/${id}/claim`, {
      method: "POST",
      headers: { "x-user-id": currentUser.id },
    });
    if (res.ok) {
      showToast("Ticket claimed successfully!");
      fetchTickets();
      if (selectedId === id) fetchTicketDetail(id);
    } else {
      const data = await res.json();
      showToast(data.error || "Failed to claim", "error");
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!currentUser || !selectedId) return;
    const res = await fetch(`/api/tickets/${selectedId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": currentUser.id,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast(`Status changed to ${status.replace(/_/g, " ")}`);
      fetchTickets();
      fetchTicketDetail(selectedId);
    } else {
      const data = await res.json();
      showToast(data.error || "Failed to change status", "error");
    }
  };

  const handlePriorityChange = async (priority: string) => {
    if (!currentUser || !selectedId) return;
    const res = await fetch(`/api/tickets/${selectedId}/priority`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": currentUser.id,
      },
      body: JSON.stringify({ priority }),
    });
    if (res.ok) {
      showToast(`Priority changed to ${priority}`);
      fetchTickets();
      fetchTicketDetail(selectedId);
    } else {
      const data = await res.json();
      showToast(data.error || "Failed to change priority", "error");
    }
  };

  const handleSendMessage = async (
    content: string,
    type: "PUBLIC_REPLY" | "INTERNAL_NOTE"
  ) => {
    if (!currentUser || !selectedId) return;
    const res = await fetch(`/api/tickets/${selectedId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": currentUser.id,
      },
      body: JSON.stringify({ content, type }),
    });
    if (res.ok) {
      showToast(type === "INTERNAL_NOTE" ? "Internal note added" : "Reply sent");
      fetchTicketDetail(selectedId);
      fetchTickets();
    } else {
      const data = await res.json();
      showToast(data.error || "Failed to send message", "error");
    }
  };

  if (!currentUser) return null;

  const isAgent = currentUser.role !== "CUSTOMER";

  return (
    <div className="flex h-screen flex-col">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter.status}
            onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REOPENED">Reopened</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            value={filter.priority}
            onChange={(e) => setFilter((f) => ({ ...f, priority: e.target.value }))}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          {isAgent && (
            <>
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={filter.assignedToMe}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, assignedToMe: e.target.checked, unassigned: false }))
                  }
                  className="rounded border-gray-300"
                />
                My Tickets
              </label>
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={filter.unassigned}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, unassigned: e.target.checked, assignedToMe: false }))
                  }
                  className="rounded border-gray-300"
                />
                Unassigned
              </label>
              <label className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <input
                  type="checkbox"
                  checked={filter.overdue}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, overdue: e.target.checked }))
                  }
                  className="rounded border-red-300"
                />
                ⚠ Overdue Only
              </label>
            </>
          )}
        </div>
        <div className="ml-auto">
          <CreateTicketModal onCreated={fetchTickets} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: ticket list */}
        <div className="w-96 shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-gray-500">Loading...</div>
          ) : (
            <TicketList
              tickets={tickets}
              selectedId={selectedId}
              onSelect={handleSelect}
              onClaim={handleClaim}
            />
          )}
        </div>

        {/* Right panel: ticket detail */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          {selectedTicket ? (
            <TicketDetailPanel
              ticket={selectedTicket}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onSendMessage={handleSendMessage}
              onClaim={() => handleClaim(selectedTicket.id)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-lg font-medium">Select a ticket to view details</p>
                <p className="text-sm">Choose from the list on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

