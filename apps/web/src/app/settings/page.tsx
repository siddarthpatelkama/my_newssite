import { demoMode } from "@/lib/demo";
import { getTelemetrySummary } from "@/lib/telemetry/summary";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ gmail?: string }> }) {
  const { gmail } = await searchParams;
  const telemetry = await getTelemetrySummary();
  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="font-serif text-4xl">The newsroom desk</h1>
      <p className="mt-4 leading-7 text-ink/80">
        Connect a dedicated Gmail account, keep newsletters in the{" "}
        <span className="font-semibold">AI-NEWSLETTERS</span> label, and let the worker publish the paper.
      </p>

      <section className="mt-10 border border-rule p-6">
        <h2 className="font-serif text-2xl">Gmail</h2>
        {gmail === "connected" ? <p role="status" className="mt-3 text-sm text-emerald-800">Gmail connected. The worker can now sync labeled newsletters.</p> : null}
        {gmail === "error" ? <p role="alert" className="mt-3 text-sm text-crimson">Google access was not completed. Start the connection again when you’re ready.</p> : null}
        <p className="mt-2 text-sm leading-6 text-mute">
          Scope is read-only. The refresh token is encrypted before it is stored. Demo mode: {demoMode ? "on" : "off"}.
        </p>
        <p className="mt-4 text-sm leading-6 text-mute">
          After configuring the Google OAuth environment variables, start the one-time mailbox authorization at{" "}
          <code>/api/gmail/start</code>.
        </p>
      </section>

      <section className="mt-6 border border-rule p-6 text-sm leading-7">
        <h2 className="font-serif text-2xl">Worker commands</h2>
        <pre className="mt-3 overflow-x-auto bg-ink p-4 text-paper">
{`npm run worker:backfill
npm run worker:process
npm run worker:briefing`}
        </pre>
      </section>

      <section className="mt-6 border border-rule p-6" aria-labelledby="reading-metrics-heading">
        <h2 id="reading-metrics-heading" className="font-serif text-2xl">Private reading metrics</h2>
        <p className="mt-2 text-sm leading-6 text-mute">
          Last 30 days. We store page visits, visible reading time, scroll bursts, and the feedback buttons you choose.
          We do not send newsletter text, page text, search terms, or tokens to this metrics table.
        </p>
        {telemetry ? (
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            {[
              ["Page visits", telemetry.pageViews], ["Reading sessions", telemetry.readingSessions],
              ["Reading minutes", telemetry.readingMinutes], ["Scroll bursts", telemetry.scrollBursts],
              ["Max read depth", `${telemetry.maxReadDepth}%`], ["Likes", telemetry.likes],
              ["Not for me", telemetry.dislikes], ["Understood", telemetry.understood],
              ["Need more context", telemetry.needsContext],
            ].map(([label, value]) => (
              <div key={label} className="border-t border-rule pt-2">
                <dt className="text-mute">{label}</dt><dd className="mt-1 text-xl">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-4 text-sm text-mute">Metrics will appear after the telemetry database migration is installed.</p>
        )}
      </section>
    </main>
  );
}
