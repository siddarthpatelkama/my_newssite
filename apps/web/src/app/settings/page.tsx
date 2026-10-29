import { demoMode } from "@/lib/demo";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ gmail?: string }> }) {
  const { gmail } = await searchParams;
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
    </main>
  );
}
