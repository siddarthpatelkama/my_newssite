export const STORY_CATEGORIES = [
  "ai-research",
  "startups",
  "engineering",
  "hackathons",
  "business",
  "science",
  "careers",
  "other",
] as const;

export const LAYOUT_VARIANTS = [
  "research_focus",
  "balanced",
  "engineering_focus",
] as const;

export const SECTION_TYPES = [
  "top_stories",
  "technical_deep_dive",
  "build_ideas",
  "radar",
  "previously_covered",
] as const;

export const PROCESSING_STATUSES = [
  "pending",
  "processing",
  "processed",
  "failed",
  "ignored",
] as const;

export const INTERACTION_ACTIONS = [
  "view",
  "save",
  "like",
  "dislike",
  "skip",
] as const;

export const RANKING_WEIGHTS = {
  relevance: 0.35,
  novelty: 0.25,
  quality: 0.2,
  usefulness: 0.1,
  recency: 0.1,
} as const;
