"use client";

import { useState, useEffect } from "react";

export function TriageEmailsButton() {
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<{
    total: number;
    failed: number;
    pending: number;
    processed: number;
    ignored: number;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function loadCounts() {
    try {
      const res = await fetch("/api/admin/triage");
      const json = await res.json();
      if (json.success && json.counts) {
        setCounts(json.counts);
      }
    } catch {}
  }

  useEffect(() => {
    loadCounts();
  }, []);

  async function handleTriage() {
    setLoading(true);
    setStatusMessage("Running AI Triage with Gemini across failed emails...");
    let totalTriaged = 0;
    let totalApproved = 0;
    let totalIgnored = 0;

    try {
      while (true) {
        const res = await fetch("/api/admin/triage", { method: "POST" });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Server returned ${res.status}: ${errText.slice(0, 100)}`);
        }
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || "Triage failed");
        }
        totalTriaged += json.triaged;
        totalApproved += json.approved;
        totalIgnored += json.ignored;

        setStatusMessage(
          `Triaging with AI... Progress: ${totalTriaged} triaged (${totalApproved} approved, ${totalIgnored} ignored). Remaining failed: ${json.remainingFailed}`,
        );
        await loadCounts();

        if (json.triaged === 0 || json.remainingFailed === 0) break;
      }

      setStatusMessage(
        `✓ All caught up! Total ${totalTriaged} emails triaged with Gemini: ${totalApproved} approved into newsroom, ${totalIgnored} marked as noise. 0 emails left in failed!`,
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to trigger triage";
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
      await loadCounts();
    }
  }

  const failedCount = counts?.failed ?? 0;

  return (
    <div className="rounded border border-rule bg-paper/50 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                failedCount === 0 ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
              }`}
            />
            <span className="font-serif font-medium text-ink">
              {failedCount === 0 ? "Zero Failed Emails" : `${failedCount} Failed Emails Pending AI Decision`}
            </span>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-semibold ${
                failedCount === 0
                  ? "bg-emerald-500/10 text-emerald-800"
                  : "bg-amber-500/10 text-amber-800"
              }`}
            >
              {failedCount === 0 ? "Optimal State" : "Action Required"}
            </span>
          </div>

          <p className="mt-1.5 text-xs text-mute max-w-md">
            Every incoming email is guaranteed to be either approved into high-signal stories or classified as ignored noise. No email ever sits in failed.
          </p>

          {counts && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-mono text-mute">
              <span>Total: {counts.total}</span>
              <span>•</span>
              <span className="text-emerald-800 font-semibold">Processed: {counts.processed}</span>
              <span>•</span>
              <span className="text-mute font-semibold">Ignored: {counts.ignored}</span>
              {counts.failed > 0 && (
                <>
                  <span>•</span>
                  <span className="text-rose-700 font-bold">Failed: {counts.failed}</span>
                </>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleTriage}
          disabled={loading}
          className="self-start sm:self-auto rounded bg-crimson px-4 py-2 text-xs font-semibold uppercase tracking-wider text-paper transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Triaging with AI..." : failedCount > 0 ? "⚡ Triage Failed Emails Now" : "🔄 Re-verify All Statuses"}
        </button>
      </div>

      {statusMessage && (
        <div className="mt-3 border-t border-rule/50 pt-2.5 text-xs font-mono text-ink">
          {statusMessage}
        </div>
      )}
    </div>
  );
}
