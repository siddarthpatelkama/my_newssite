import { getTelemetrySummary } from "@/lib/telemetry/summary";
import { createAdminSupabase } from "@/lib/supabase/admin";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ gmail?: string }> }) {
  const { gmail } = await searchParams;
  const telemetry = await getTelemetrySummary();
  const supabase = createAdminSupabase();
  const { data: creds } = supabase
    ? await supabase.from("gmail_credentials").select("account_email, updated_at").eq("id", "default").maybeSingle()
    : { data: null };

  const isConnected = Boolean(creds?.account_email);

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="font-serif text-4xl">The newsroom desk</h1>
      <p className="mt-4 leading-7 text-ink/80">
        Connect your dedicated Gmail account, and the background worker will curate high-signal newsletters into your personal daily edition.
      </p>

      <section className="mt-10 border border-rule p-6">
        <h2 className="font-serif text-2xl">Gmail Connection</h2>
        {gmail === "connected" ? (
          <p role="status" className="mt-3 text-sm font-medium text-emerald-800">
            ✓ Gmail connected successfully! The background worker can now fetch your inbox newsletters.
          </p>
        ) : null}
        {gmail === "error" ? (
          <p role="alert" className="mt-3 text-sm font-medium text-crimson">
            Google authorization was not completed. Click the button below to connect again.
          </p>
        ) : null}

        {isConnected ? (
          <div className="mt-4 border-l-2 border-emerald-600 pl-4 py-1">
            <p className="text-sm font-medium text-ink">Connected Account: {creds?.account_email}</p>
            <p className="text-xs text-mute mt-1">Authorized for read-only newsletter sync.</p>
          </div>
        ) : (
          <div className="mt-4 border-l-2 border-amber-600 pl-4 py-1">
            <p className="text-sm font-medium text-amber-900">Not Connected</p>
            <p className="text-xs text-mute mt-1">
              If database rows were recently wiped, re-authorize your Gmail mailbox so the background worker can sync your emails.
            </p>
          </div>
        )}

        <div className="mt-6">
          <a
            href="/api/gmail/start"
            className="inline-block bg-crimson px-5 py-2.5 text-sm font-medium text-paper hover:opacity-90 transition-opacity"
          >
            {isConnected ? "Reconnect Gmail Account →" : "Connect Gmail Account →"}
          </a>
        </div>
      </section>

      <section className="mt-6 border border-rule p-6 text-sm leading-7">
        <h2 className="font-serif text-2xl">Worker commands</h2>
        <pre className="mt-3 overflow-x-auto bg-ink p-4 text-paper">
{`npm run worker:run
npm run worker:sync
npm run worker:process
npm run worker:briefing`}
        </pre>
      </section>

      <section className="mt-6 border border-rule p-6 text-sm leading-7">
        <h2 className="font-serif text-2xl">Telemetry snapshot</h2>
        <p className="mt-3 text-mute">
          Reading sessions (30d): {telemetry?.readingSessions ?? 0} · Reading minutes: {telemetry?.readingMinutes ?? 0} · Page views: {telemetry?.pageViews ?? 0}
        </p>
      </section>
    </main>
  );
}
