"use client";

import { useState, useEffect } from "react";

export function ManualSyncButton() {
  const [loading, setLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [totalEmails, setTotalEmails] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function checkStatus() {
    try {
      const res = await fetch("/api/admin/sync-now");
      const json = await res.json();
      if (json.success) {
        if (json.lastSyncedAt) setLastSynced(json.lastSyncedAt);
        if (typeof json.totalEmails === "number") setTotalEmails(json.totalEmails);
      }
    } catch {}
  }

  useEffect(() => {
    checkStatus();
  }, []);

  async function handleSync() {
    setLoading(true);
    setStatusMessage("Connecting to inboxes & pulling latest newsletter dispatches...");

    try {
      const res = await fetch("/api/admin/sync-now", { method: "POST" });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to trigger sync");
      }

      setLastSynced(json.lastSyncedAt);
      if (typeof json.totalEmails === "number") setTotalEmails(json.totalEmails);
      setStatusMessage(
        `✓ Sync complete! ${json.message || "Checked inboxes."} (${json.totalEmails || 0} emails indexed, ${json.processedCount || 0} processed). Live feed updated!`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync trigger failed";
      setStatusMessage(`Sync notice: ${msg}`);
    } finally {
      setLoading(false);
      checkStatus();
    }
  }

  return (
    <div className="rounded border border-rule bg-paper/60 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="font-serif font-medium text-ink">Manual Inbox & Feed Sync</span>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-800">
              Live Trigger
            </span>
          </div>
          <p className="mt-1.5 text-xs text-mute max-w-md leading-relaxed">
            Instantly poll connected newsletter inboxes, run triage on new incoming mail, and invalidate cached editions to surface latest coverage immediately.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] font-mono text-mute">
            {lastSynced ? (
              <span>Last checked: {new Date(lastSynced).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            ) : (
              <span>Status: Ready to sync</span>
            )}
            {totalEmails !== null && (
              <>
                <span>•</span>
                <span>{totalEmails} total emails stored</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 rounded bg-ink px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper transition hover:bg-crimson disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block h-3.5 w-3.5 border-2 border-paper border-t-transparent rounded-full" />
              <span>Syncing Inboxes...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Sync Inboxes Now</span>
            </>
          )}
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

