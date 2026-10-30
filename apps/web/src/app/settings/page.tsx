import { DefaultShell } from "@/components/layout/DefaultShell";
import { getTelemetrySummary } from "@/lib/telemetry/summary";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { EvolveThemeButton } from "@/components/theme/EvolveThemeButton";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ gmail?: string }> }) {
  const { gmail } = await searchParams;
  const telemetry = await getTelemetrySummary();
  const supabase = createAdminSupabase();

  const [credsRes, tasteRes] = await Promise.all([
    supabase ? supabase.from("gmail_credentials").select("account_email, updated_at").eq("id", "default").maybeSingle() : Promise.resolve({ data: null }),
    supabase ? supabase.from("ui_taste_feedback").select("theme_id, score, sentiment, notes, created_at").order("created_at", { ascending: false }).limit(6) : Promise.resolve({ data: [] }),
  ]);

  const creds = credsRes.data;
  const tasteRatings = tasteRes.data ?? [];
  const isConnected = Boolean(creds?.account_email);

  return (
    <DefaultShell>
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
              className="inline-block bg-crimson px-5 py-2.5 text-xs uppercase tracking-[0.2em] font-medium text-paper hover:opacity-90 transition-opacity"
            >
              {isConnected ? "Reconnect Gmail Mailbox →" : "Connect Gmail Account →"}
            </a>
          </div>
        </section>

        {/* AI Generative Design & Taste Profile Section */}
        <section className="mt-12 border border-rule p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rule/60 pb-5">
            <div>
              <h2 className="font-serif text-2xl text-ink">AI Design Evolution</h2>
              <p className="mt-1 text-xs text-mute max-w-sm">
                Each rating shapes Gemini&apos;s palettes, fonts, and atmosphere for future daily editions.
              </p>
            </div>
            <EvolveThemeButton />
          </div>

          <div className="mt-6">
            <h3 className="font-serif text-xs font-semibold uppercase tracking-wider text-mute mb-3">
              Recorded Design Taste Feedback
            </h3>
            {!tasteRatings.length ? (
              <p className="text-xs text-mute py-3">
                No ratings logged yet. Scroll to the bottom of the home edition to rate today&apos;s aesthetic!
              </p>
            ) : (
              <div className="space-y-3">
                {tasteRatings.map((rating) => {
                  let meta: Record<string, unknown> = {};
                  try {
                    if (rating.notes && rating.notes.startsWith("{")) meta = JSON.parse(rating.notes) as Record<string, unknown>;
                  } catch {}
                  const themeDisplayName = typeof meta.themeName === "string" ? meta.themeName : rating.theme_id;
                  const keywordsList = Array.isArray(meta.keywords) ? (meta.keywords as string[]) : [];
                  return (
                    <div
                      key={rating.created_at}
                      className="flex items-center justify-between border-b border-rule/40 pb-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-ink">{themeDisplayName}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                            rating.sentiment === "like"
                              ? "bg-emerald-500/10 text-emerald-800"
                              : "bg-rose-500/10 text-rose-800"
                          }`}
                        >
                          {rating.sentiment.toUpperCase()}
                        </span>
                        <div className="hidden sm:flex items-center gap-1">
                          {keywordsList.slice(0, 3).map((kw: string) => (
                            <span key={kw} className="text-[10px] text-mute font-mono">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="font-serif font-bold text-ink">{rating.score}/100</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">Telemetry</h2>
          <p className="mt-2 text-sm text-mute">
            Live telemetry tracks interaction latencies, error states, and session signals.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-4 border border-rule p-6 text-sm">
            <div>
              <dt className="text-mute">Reading sessions</dt>
              <dd className="mt-1 font-serif text-2xl">{telemetry?.readingSessions ?? 0}</dd>
            </div>
            <div>
              <dt className="text-mute">Page views</dt>
              <dd className="mt-1 font-serif text-2xl">{telemetry?.pageViews ?? 0}</dd>
            </div>
            <div className="mt-4">
              <dt className="text-mute">Minutes read</dt>
              <dd className="mt-1 font-serif text-2xl">{telemetry?.readingMinutes ?? 0} m</dd>
            </div>
            <div className="mt-4">
              <dt className="text-mute">Feedback signals</dt>
              <dd className="mt-1 font-serif text-2xl">
                {(telemetry?.likes ?? 0) + (telemetry?.dislikes ?? 0)}
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </DefaultShell>
  );
}
