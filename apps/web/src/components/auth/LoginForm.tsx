"use client";

import { FormEvent, useState } from "react";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: form.get("password"), next: nextPath }),
      });
      const result = await response.json() as { error?: string; next?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not sign in.");
      window.location.assign(result.next ?? "/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label className="block text-xs uppercase tracking-[0.18em] text-mute" htmlFor="password">App password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required className="w-full border border-rule bg-transparent px-4 py-3" />
      {error ? <p role="alert" className="text-sm text-crimson">{error}</p> : null}
      <button disabled={busy} className="bg-ink px-5 py-3 text-xs uppercase tracking-[0.2em] text-paper disabled:opacity-60">
        {busy ? "Opening…" : "Open SignalOS"}
      </button>
    </form>
  );
}
