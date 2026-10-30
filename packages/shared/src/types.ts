import type { INTERACTION_ACTIONS, PROCESSING_STATUSES, STORY_CATEGORIES } from "./constants";

export type StoryCategory = (typeof STORY_CATEGORIES)[number];
export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number];
export type InteractionAction = (typeof INTERACTION_ACTIONS)[number];

export type Story = {
  id: string;
  canonicalTitle: string;
  summary: string | null;
  whyItMatters: string | null;
  category: StoryCategory | null;
  keyPoints: string[];
  entities: string[];
  noveltyScore: number | null;
  qualityScore: number | null;
  firstSeenAt: string;
  lastUpdatedAt: string;
};

export type StorySource = {
  id: string;
  title: string;
  canonicalUrl: string | null;
  sourceName: string | null;
  newsletterName: string | null;
};

export type StoryTimelineMilestone = {
  date: string;
  title: string;
  description: string;
  storyId?: string;
  sourceNote?: string;
};

export type StoryWithRelations = Story & {
  sources: StorySource[];
  storyUpdates: Array<{
    id: string;
    note: string;
    createdAt: string;
    relatedStoryId?: string | null;
  }>;
  relatedStories: Array<{
    id: string;
    canonicalTitle: string;
    summary: string | null;
    category: StoryCategory | null;
    firstSeenAt: string;
  }>;
  timeline: StoryTimelineMilestone[];
};

export type DailyBriefing = {
  id: string;
  editionDate: string;
  title: string;
  introduction: string | null;
  sections: unknown;
  status: "draft" | "published" | "failed";
  publishedAt: string | null;
};
