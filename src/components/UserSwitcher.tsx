"use client";

import { useUser } from "@/context/UserContext";

const roleBadgeColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  AGENT: "bg-blue-100 text-blue-800",
  CUSTOMER: "bg-green-100 text-green-800",
};

export default function UserSwitcher() {
  const { currentUser, users, setCurrentUser } = useUser();

  if (!currentUser) return null;

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-600">Acting as:</label>
      <select
        value={currentUser.id}
        onChange={(e) => {
          const user = users.find((u) => u.id === e.target.value);
          if (user) setCurrentUser(user);
        }}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.role})
          </option>
        ))}
      </select>
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          roleBadgeColors[currentUser.role] ?? "bg-gray-100 text-gray-800"
        }`}
      >
        {currentUser.role}
      </span>
    </div>
  );
}

