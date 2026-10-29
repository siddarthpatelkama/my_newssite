import { z } from "zod";
import { LAYOUT_VARIANTS, SECTION_TYPES, STORY_CATEGORIES } from "./constants";

export const ExtractedStorySchema = z.object({
  title: z.string().min(1),
  summary: z.string(),
  whyItMatters: z.string(),
  category: z.enum(STORY_CATEGORIES),
  keyPoints: z.array(z.string()),
  entities: z.array(z.string()),
  novelty: z.number().min(0).max(1),
  sourceClaims: z.array(
    z.object({
      claim: z.string(),
      supportingExcerpt: z.string(),
    }),
  ),
});

export type ExtractedStory = z.infer<typeof ExtractedStorySchema>;

export const EmailArticleSchema = z.object({
  title: z.string().min(1),
  canonicalUrl: z.string().url().optional(),
  sourceName: z.string().optional(),
  contentText: z.string(),
});

export const ExtractedEmailSchema = z.object({
  keep: z.boolean(),
  reason: z.string(),
  articles: z.array(EmailArticleSchema),
});

export type ExtractedEmail = z.infer<typeof ExtractedEmailSchema>;

export const DashboardSectionSchema = z.object({
  type: z.enum(SECTION_TYPES),
  title: z.string(),
  storyIds: z.array(z.string().uuid()),
});

export const DashboardConfigSchema = z.object({
  edition: z.string(),
  layout: z.enum(LAYOUT_VARIANTS),
  sections: z.array(DashboardSectionSchema).min(1),
});

export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;
