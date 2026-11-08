import { z } from "zod";

export const beatSchema = z.enum(["near", "ai", "markets"]);

export const sourceFactSchema = z.object({
  id: z.string().min(2).max(80),
  text: z.string().min(20).max(600),
  sourceTitle: z.string().min(2).max(200),
  sourceUrl: z.string().url(),
  supportingQuote: z.string().min(10).max(500).optional(),
});

export const sourceTopicSchema = z.object({
  id: z.string().min(2).max(80),
  beat: beatSchema,
  title: z.string().min(3).max(160),
  angleHint: z.string().min(3).max(200),
  facts: z.array(sourceFactSchema).min(3).max(10),
});

export const sourcePackSchema = z
  .object({
    editionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    topics: z.array(sourceTopicSchema).min(3).max(12),
  })
  .superRefine((pack, ctx) => {
    const factIds = new Set<string>();
    for (const topic of pack.topics) {
      for (const fact of topic.facts) {
        if (factIds.has(fact.id)) {
          ctx.addIssue({
            code: "custom",
            message: `Duplicate fact id: ${fact.id}`,
            path: ["topics", topic.id, "facts", fact.id],
          });
        }
        factIds.add(fact.id);
      }
    }
  });

export type SourcePackInput = z.infer<typeof sourcePackSchema>;
