"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserProvider, useUser } from "@/context/UserContext";
import UserNav from "@/components/UserSwitcher";
import Dashboard from "@/components/Dashboard";

function AuthenticatedApp() {
  const { currentUser, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="text-3xl animate-spin mb-3">⚙️</div>
          <p className="text-sm text-gray-300 font-medium">Verifying Session Security...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      {/* Top navbar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">
            🎫 Frontdesk
          </h1>
          <span className="text-xs text-gray-400">by Arvo Systems</span>
        </div>
        <UserNav />
      </header>

      {/* Dashboard */}
      <main className="flex-1 overflow-hidden">
        <Dashboard />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <UserProvider>
      <AuthenticatedApp />
    </UserProvider>
  );
}
