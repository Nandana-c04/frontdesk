"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [portal, setPortal] = useState<"support" | "customer">("support");
  const [email, setEmail] = useState("ravi@arvo.io");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePortalSwitch = (p: "support" | "customer") => {
    setPortal(p);
    setError("");
    if (p === "support") {
      setEmail("ravi@arvo.io");
      setPassword("password123");
    } else {
      setEmail("priya@client.com");
      setPassword("password123");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portal }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white shadow-md">
            🎫
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
            Frontdesk Access Portal
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Arvo Systems Support & Incident Resolution System
          </p>
        </div>

        {/* Portal Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => handlePortalSwitch("support")}
            className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all ${
              portal === "support"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            🛡️ Support & Developer Desk
          </button>
          <button
            type="button"
            onClick={() => handlePortalSwitch("customer")}
            className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all ${
              portal === "customer"
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            👤 Client Portal
          </button>
        </div>

        {/* Notice of separation */}
        <div
          className={`rounded-lg p-3 text-xs leading-relaxed border ${
            portal === "support"
              ? "bg-blue-50 border-blue-200 text-blue-900"
              : "bg-green-50 border-green-200 text-green-900"
          }`}
        >
          {portal === "support" ? (
            <span>
              <strong>Restricted Gateway:</strong> Only authorized support agents and developers can claim tickets, view internal technical notes, and manage SLAs.
            </span>
          ) : (
            <span>
              <strong>Customer Area:</strong> Submit issues and view public resolution updates. Confidential internal notes are strictly quarantined.
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Work Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-md transition-all ${
              portal === "support"
                ? "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
                : "bg-green-600 hover:bg-green-700 disabled:bg-green-400"
            }`}
          >
            {loading ? "Verifying Credentials..." : `Sign In to ${portal === "support" ? "Support Desk" : "Client Portal"}`}
          </button>
        </form>

        {/* Quick Demo Credentials Assistant */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-[11px] font-medium text-gray-500 text-center mb-2">
            Demo Credentials (Password: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-gray-800">password123</code>):
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 text-[11px]">
            {portal === "support" ? (
              <>
                <button
                  type="button"
                  onClick={() => setEmail("ravi@arvo.io")}
                  className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 hover:bg-slate-200"
                >
                  Ravi (Support)
                </button>
                <button
                  type="button"
                  onClick={() => setEmail("sneha@arvo.io")}
                  className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 hover:bg-slate-200"
                >
                  Sneha (Dev)
                </button>
                <button
                  type="button"
                  onClick={() => setEmail("meera@arvo.io")}
                  className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 hover:bg-slate-200"
                >
                  Meera (Lead)
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEmail("priya@client.com")}
                  className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 hover:bg-slate-200"
                >
                  Priya (Client)
                </button>
                <button
                  type="button"
                  onClick={() => setEmail("vikram@client.com")}
                  className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 hover:bg-slate-200"
                >
                  Vikram (Client)
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

