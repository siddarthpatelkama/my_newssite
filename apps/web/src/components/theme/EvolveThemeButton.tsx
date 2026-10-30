"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EvolveThemeButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  const handleEvolve = async () => {
    setLoading(true);
    setStatus("Synthesizing evolved theme from your taste ratings and headlines...");

    try {
      const res = await fetch("/api/theme/evolve", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setStatus(`✓ Evolved to "${data.evolvedTheme?.themeName}"! Applying to paper...`);
        setTimeout(() => {
          router.refresh();
          window.location.href = "/";
        }, 1200);
      } else {
        setStatus("Could not evolve theme: " + (data.error || "Unknown error"));
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setStatus("Failed to connect to theme endpoint.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleEvolve}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 font-serif text-xs font-semibold text-paper transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-sm"
      >
        <span>⚡</span>
        <span>{loading ? "Synthesizing Theme with Gemini..." : "Re-Synthesize Today's Theme Now"}</span>
      </button>

      {status ? (
        <p className="text-xs font-mono text-crimson animate-in fade-in">{status}</p>
      ) : null}
    </div>
  );
}
