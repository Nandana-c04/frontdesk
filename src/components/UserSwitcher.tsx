"use client";

import { useUser } from "@/context/UserContext";

const roleBadgeColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  AGENT: "bg-blue-100 text-blue-800",
  CUSTOMER: "bg-green-100 text-green-800",
};

export default function UserNav() {
  const { currentUser, logout } = useUser();

  if (!currentUser) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white uppercase">
          {currentUser.name.slice(0, 2)}
        </div>
        <div className="text-left">
          <div className="text-xs font-semibold text-gray-900 leading-tight">
            {currentUser.name}
          </div>
          <div className="text-[10px] text-gray-500">{currentUser.email}</div>
        </div>
        <span
          className={`ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            roleBadgeColors[currentUser.role] ?? "bg-gray-100 text-gray-800"
          }`}
        >
          {currentUser.role === "CUSTOMER" ? "Client Portal" : "Support & Dev"}
        </span>
      </div>

      <button
        onClick={logout}
        className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
