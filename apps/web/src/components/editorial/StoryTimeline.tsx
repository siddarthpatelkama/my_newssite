import Link from "next/link";
import type { StoryMilestone } from "@/lib/queries";

export interface StoryTimelineProps {
  timeline: StoryMilestone[];
  relatedHistoricalStories: Array<{
    id: string;
    canonicalTitle: string;
    summary: string | null;
    category: string | null;
    firstSeenAt: string;
  }>;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function StoryTimeline({ timeline, relatedHistoricalStories }: StoryTimelineProps) {
  const hasTimeline = timeline && timeline.length > 1;
  const hasRelated = relatedHistoricalStories && relatedHistoricalStories.length > 0;

  if (!hasTimeline && !hasRelated) {
    return null;
  }

  return (
    <section className="mt-12 rounded-lg border border-rule bg-paper/60 p-6 sm:p-8 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-rule pb-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-crimson">
            Historical Intelligence Continuity
          </span>
          <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight text-ink">
            Story Evolution & Precedent Timeline
          </h2>
        </div>
        <span className="inline-flex items-center rounded-full border border-rule px-3 py-1 text-[11px] font-medium tracking-wider text-mute">
          ⏱️ Chronological Chain
        </span>
      </div>

      {hasTimeline && (
        <div className="relative mt-8 pl-6 sm:pl-8">
          {/* Vertical continuity line */}
          <div className="absolute bottom-4 left-2 top-3 w-px bg-rule sm:left-3" />

          <div className="space-y-8">
            {timeline.map((milestone, idx) => {
              const isLast = idx === timeline.length - 1;
              return (
                <div key={`${milestone.date}-${idx}`} className="relative group">
                  {/* Timeline node marker */}
                  <div
                    className={`absolute -left-[23px] top-1.5 h-3 w-3 rounded-full border-2 border-paper transition-transform group-hover:scale-125 sm:-left-[27px] ${
                      isLast ? "bg-crimson ring-4 ring-crimson/20" : "bg-ink/60"
                    }`}
                  />

                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-crimson">
                      {milestone.label}
                    </span>
                    <span className="text-xs text-mute font-mono">
                      • {formatDate(milestone.date)}
                    </span>
                  </div>

                  <p className="mt-1.5 font-serif text-base leading-relaxed text-ink/90">
                    {milestone.description}
                  </p>

                  {milestone.relatedStoryId && (
                    <div className="mt-3 inline-block">
                      <Link
                        href={`/stories/${milestone.relatedStoryId}`}
                        className="inline-flex items-center gap-1.5 rounded border border-rule bg-paper px-3 py-1 text-xs font-medium text-ink transition hover:border-crimson hover:text-crimson"
                      >
                        <span>← Read historical context:</span>
                        <span className="font-serif italic underline underline-offset-2">
                          {milestone.relatedStoryTitle || "View previous incident coverage"}
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasRelated && (
        <div className="mt-10 border-t border-rule pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-mute">
            Connected Stories From Past Weeks & Months
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedHistoricalStories.map((rel) => (
              <Link
                key={rel.id}
                href={`/stories/${rel.id}`}
                className="group flex flex-col justify-between rounded border border-rule/80 bg-paper/80 p-4 transition hover:border-crimson hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-mute">
                    <span>{rel.category?.replace("-", " ") || "Archive"}</span>
                    <span>{formatDate(rel.firstSeenAt)}</span>
                  </div>
                  <h4 className="mt-2 font-serif text-base font-medium leading-snug text-ink transition group-hover:text-crimson">
                    {rel.canonicalTitle}
                  </h4>
                  {rel.summary && (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-mute">
                      {rel.summary}
                    </p>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-crimson">
                  <span>Explore archived incident</span>
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

