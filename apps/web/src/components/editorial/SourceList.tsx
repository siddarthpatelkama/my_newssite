import type { StoryRecord } from "@/lib/queries";

export function SourceList({ sources }: { sources: StoryRecord["sources"] }) {
  if (!sources.length) return null;
  return (
    <section>
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-mute">Original sources</h2>
      <ul className="mt-3 divide-y divide-rule border-y border-rule">
        {sources.map((source) => (
          <li key={source.id} className="py-3">
            <p className="font-serif text-lg">{source.title}</p>
            <p className="text-xs uppercase tracking-[0.16em] text-mute">
              {source.newsletterName ?? source.sourceName ?? "Newsletter"}
            </p>
            {source.canonicalUrl ? (
              <a href={source.canonicalUrl} className="text-sm text-crimson underline-offset-2 hover:underline">
                {source.canonicalUrl}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
