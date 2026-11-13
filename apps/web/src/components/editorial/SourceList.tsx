import Link from "next/link";
import type { StoryRecord } from "@/lib/queries";

export function SourceList({ sources }: { sources: StoryRecord["sources"] }) {
  if (!sources.length) return null;
  return (
    <section>
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-mute">Original sources & provenance</h2>
      <ul className="mt-3 divide-y divide-rule border-y border-rule">
        {sources.map((source) => {
          const emailTargetId = source.emailId || source.id;
          const directGmailUrl = source.gmailMessageId
            ? `https://mail.google.com/mail/u/0/#all/${source.gmailMessageId}`
            : `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(source.title || source.sourceName || "")}`;

          return (
            <li key={source.id} className="py-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                <p className="font-serif text-lg font-medium text-ink">{source.title}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-mute font-mono shrink-0">
                  {source.newsletterName ?? source.sourceName ?? "Newsletter Dispatch"}
                </p>
              </div>

              {/* Multi-Destination Provenance Action Controls */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {/* 1. In-App Dedicated Email Reader */}
                <Link
                  href={`/emails/${emailTargetId}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rule/90 bg-paper px-3 py-1 font-serif text-xs font-semibold text-crimson transition hover:border-crimson hover:bg-paper"
                  title="Read original full email formatted in SignalOS"
                >
                  <span>✉️</span>
                  <span>Read original email →</span>
                </Link>

                {/* 2. Direct Gmail Link */}
                <a
                  href={directGmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rule/70 bg-paper/60 px-2.5 py-1 font-serif text-xs text-mute transition hover:border-ink hover:text-ink"
                  title="Open directly in your Gmail mailbox"
                >
                  <span>Open in Gmail ↗</span>
                </a>

                {/* 3. Original Publisher Web Article (if available) */}
                {source.canonicalUrl && (
                  <a
                    href={source.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rule/70 bg-paper/60 px-2.5 py-1 font-serif text-xs text-mute transition hover:border-ink hover:text-ink"
                    title="Open publisher's external web URL"
                  >
                    <span>Web source ↗</span>
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
