"use client";

import { UserProvider } from "@/context/UserContext";
import UserSwitcher from "@/components/UserSwitcher";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <UserProvider>
      <div className="flex h-screen flex-col bg-gray-100">
        {/* Top navbar */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              🎫 Frontdesk
            </h1>
            <span className="text-xs text-gray-400">by Arvo Systems</span>
          </div>
          <UserSwitcher />
        </header>

        {/* Dashboard */}
        <main className="flex-1 overflow-hidden">
          <Dashboard />
        </main>
      </div>
    </UserProvider>
  );
}
