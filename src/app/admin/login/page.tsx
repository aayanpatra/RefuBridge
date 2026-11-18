"use client";

import { useState, type FormEvent } from "react";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: formData.get("password") }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to sign in.");

      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const nextPath = requestedPath?.startsWith("/admin/") && requestedPath !== "/admin/login"
        ? requestedPath
        : "/admin";
      window.location.assign(nextPath);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08111d] px-5 text-slate-100">
      <section className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#101c2c] p-7 shadow-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">RefuBridge</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Admin sign in</h1>
        <p className="mt-2 text-sm text-slate-400">Enter the admin password to open the operations dashboard.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-xs font-medium text-slate-300" htmlFor="password">Password</label>
          <input
            autoComplete="current-password"
            className="w-full rounded-lg border border-white/10 bg-[#08111d] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400"
            id="password"
            name="password"
            required
            type="password"
          />
          {error && <p className="text-xs text-rose-300" role="alert">{error}</p>}
          <button
            className="w-full rounded-lg bg-[#315fda] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#416fe9] disabled:opacity-50"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
