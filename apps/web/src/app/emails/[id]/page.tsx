import Link from "next/link";
import { notFound } from "next/navigation";
import { DefaultShell } from "@/components/layout/DefaultShell";
import { getActiveThemeSpec, getEmail } from "@/lib/queries";
import { EmailContentViewer } from "@/components/editorial/EmailContentViewer";

export const dynamic = "force-dynamic";

export default async function EmailViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const email = await getEmail(id);

  if (!email) {
    notFound();
  }

  const themeSpec = await getActiveThemeSpec();

  // Construct direct Gmail deep link
  const gmailQuery = email.gmailMessageId
    ? `rfc822msgid:${email.gmailMessageId}`
    : email.subject || email.senderEmail || "";
  const directGmailUrl = email.gmailMessageId
    ? `https://mail.google.com/mail/u/0/#all/${email.gmailMessageId}`
    : `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(gmailQuery)}`;

  const formattedDate = email.receivedAt
    ? new Date(email.receivedAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <DefaultShell themeSpec={themeSpec}>
      <main className="mx-auto max-w-4xl space-y-8">
        {/* Top Navigation & Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4 text-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-serif text-crimson hover:underline"
            >
              <span>←</span>
              <span>Back to edition</span>
            </Link>
            {email.storyId && (
              <>
                <span className="text-mute">/</span>
                <Link
                  href={`/stories/${email.storyId}`}
                  className="inline-flex items-center gap-1 font-serif text-mute hover:text-ink hover:underline"
                >
                  <span>Story:</span>
                  <span className="italic line-clamp-1 max-w-[200px]">{email.storyTitle}</span>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {email.canonicalUrl && (
              <a
                href={email.canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-paper px-3 py-1.5 font-serif text-xs font-medium text-ink transition hover:border-crimson hover:text-crimson"
                title="Open publisher's original web article"
              >
                <span>🌐</span>
                <span>Web Article ↗</span>
              </a>
            )}

            <a
              href={directGmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-crimson/30 bg-crimson/10 px-3 py-1.5 font-serif text-xs font-semibold text-crimson transition hover:bg-crimson hover:text-paper"
              title="Open this newsletter directly in your Gmail mailbox"
            >
              <span>✉️</span>
              <span>Open in Gmail ↗</span>
            </a>
          </div>
        </div>

        {/* Email Header Card */}
        <header className="rounded-xl border border-rule/80 bg-paper/70 p-6 sm:p-8 backdrop-blur-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-0.5 text-[10px] font-mono uppercase tracking-wider text-crimson bg-crimson/5">
              <span>●</span>
              <span>Original Newsletter Email</span>
            </span>
            {formattedDate && (
              <span className="text-xs text-mute font-mono">{formattedDate}</span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight text-ink">
            {email.subject || "Untitled Newsletter Dispatch"}
          </h1>

          <div className="border-t border-rule/50 pt-4 text-xs font-sans text-mute space-y-1">
            <p>
              <strong className="text-ink font-medium">From:</strong>{" "}
              <span>{email.senderName || "Unknown Publisher"}</span>{" "}
              {email.senderEmail && (
                <span className="font-mono text-mute/80">&lt;{email.senderEmail}&gt;</span>
              )}
            </p>
            {email.gmailMessageId && (
              <p className="font-mono text-[11px] text-mute/70">
                <span>Message ID:</span> {email.gmailMessageId}
              </p>
            )}
          </div>
        </header>

        {/* Interactive Content Viewer */}
        <EmailContentViewer
          bodyHtml={email.bodyHtml}
          bodyText={email.bodyText}
          directGmailUrl={directGmailUrl}
        />

        {/* Context & Provenance Footer */}
        <footer className="rounded-lg border border-rule/60 bg-paper/40 p-4 text-xs text-mute font-sans flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p>
            This original email was indexed from your authorized newsletter inbox by SignalOS.
          </p>
          {email.storyId && (
            <Link
              href={`/stories/${email.storyId}`}
              className="font-serif text-crimson hover:underline shrink-0"
            >
              View Synthesized Story →
            </Link>
          )}
        </footer>
      </main>
    </DefaultShell>
  );
}
