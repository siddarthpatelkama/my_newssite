export const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const demoStories = [
  {
    id: "11111111-aaaa-4aaa-8aaa-111111111111",
    canonicalTitle: "Agent frameworks are becoming operating systems",
    summary:
      "Multiple newsletters covered the same shift: coding agents are no longer chat wrappers. They are acquiring memory, tools, and long-running control loops.",
    whyItMatters:
      "If you build software, the interesting question is no longer whether agents can write code. It is which parts of your workflow should become durable agent loops.",
    category: "ai-research",
    keyPoints: [
      "Three newsletters described the same framework launch with different emphasis.",
      "Benchmarks remain vendor-reported and should be treated as claims.",
      "Local tool use and evals matter more than the model card.",
    ],
    entities: ["Gemini", "Next.js", "Supabase"],
    noveltyScore: 0.86,
    qualityScore: 0.8,
    firstSeenAt: "2026-10-27T08:00:00.000Z",
    lastUpdatedAt: "2026-10-29T06:00:00.000Z",
    sources: [
      {
        id: "src-1",
        title: "Original framework announcement",
        canonicalUrl: "https://example.com/framework",
        sourceName: "Example Lab",
        newsletterName: "Example Lab",
      },
    ],
  },
  {
    id: "22222222-bbbb-4bbb-8bbb-222222222222",
    canonicalTitle: "The inbox is a better news API than most feeds",
    summary:
      "A practical pattern is emerging: dedicated Gmail labels plus scheduled sync can power a private intelligence product without scraping the public web.",
    whyItMatters:
      "Your newsletters already filter the internet. The missing layer is clustering, memory, and an editorial homepage.",
    category: "engineering",
    keyPoints: [
      "Gmail history cursors expire and need a fallback backfill.",
      "Push notifications are optional; polling is enough for a personal system.",
    ],
    entities: ["Gmail API", "OAuth"],
    noveltyScore: 0.7,
    qualityScore: 0.74,
    firstSeenAt: "2026-10-28T09:00:00.000Z",
    lastUpdatedAt: "2026-10-29T07:30:00.000Z",
    sources: [
      {
        id: "src-2",
        title: "Gmail API push guide",
        canonicalUrl: "https://developers.google.com/gmail/api/guides/push",
        sourceName: "Google for Developers",
        newsletterName: "Example Intel",
      },
    ],
  },
  {
    id: "33333333-cccc-4ccc-8ccc-333333333333",
    canonicalTitle: "Provenance is the difference between a briefing and a rumor mill",
    summary:
      "Repeating a claim across five newsletters is not independent confirmation. SignalOS keeps excerpts, source URLs, and uncertainty attached to every card.",
    whyItMatters:
      "An intelligence site that cannot show its sources will eventually mislead you, especially when vendors announce the same product in lockstep.",
    category: "business",
    keyPoints: [
      "Store raw email separately from model output so you can reprocess later.",
      "Validate model JSON before it reaches PostgreSQL.",
    ],
    entities: ["PostgreSQL", "Gemini"],
    noveltyScore: 0.64,
    qualityScore: 0.9,
    firstSeenAt: "2026-10-26T11:00:00.000Z",
    lastUpdatedAt: "2026-10-29T04:00:00.000Z",
    sources: [
      {
        id: "src-3",
        title: "Why source-linked summaries matter",
        canonicalUrl: "https://example.com/provenance",
        sourceName: "Example Intel",
        newsletterName: "Example Intel",
      },
    ],
  },
  {
    id: "44444444-dddd-4ddd-8ddd-444444444444",
    canonicalTitle: "Build from the news: a personal intelligence paper",
    summary:
      "The useful output of a newsletter system is not another digest. It is a project you can start because the news made a gap obvious.",
    whyItMatters:
      "If a story cannot become an experiment, a note, or a prototype, it is probably entertainment. Keep those, but rank them lower.",
    category: "hackathons",
    keyPoints: [
      "Generate a learning path only for technical stories.",
      "Link to documentation rather than inventing APIs.",
    ],
    entities: ["SignalOS"],
    noveltyScore: 0.58,
    qualityScore: 0.77,
    firstSeenAt: "2026-10-29T02:00:00.000Z",
    lastUpdatedAt: "2026-10-29T02:00:00.000Z",
    sources: [
      {
        id: "src-4",
        title: "Project idea extracted from coverage",
        canonicalUrl: "https://example.com/build",
        sourceName: "Example Lab",
        newsletterName: "Example Lab",
      },
    ],
  },
];

export const demoBriefing = {
  editionDate: "2026-10-29",
  title: "Thursday · The daily edition",
  introduction:
    "A curated view of developments across AI research, software engineering, and the systems that turn newsletters into memory.",
  layout: "research_focus" as const,
  sections: [
    {
      type: "top_stories",
      title: "The important developments",
      storyIds: [
        "11111111-aaaa-4aaa-8aaa-111111111111",
        "22222222-bbbb-4bbb-8bbb-222222222222",
      ],
    },
    {
      type: "technical_deep_dive",
      title: "Understand the technology",
      storyIds: ["33333333-cccc-4ccc-8ccc-333333333333"],
    },
    {
      type: "build_ideas",
      title: "What you could build",
      storyIds: ["44444444-dddd-4ddd-8ddd-444444444444"],
    },
  ],
};
