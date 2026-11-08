import { z } from "zod";

const trimmed = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

export const beatSchema = z.enum(["near", "ai", "markets"]);

export const claimSchema = z.object({
  text: trimmed(8, 500),
  sourceId: z.string().trim().min(2).max(80),
});

export const pitchSchema = z.object({
  id: z.string().trim().min(2).max(120),
  agentId: z.string().trim().min(2).max(80),
  headline: trimmed(8, 90),
  angle: trimmed(8, 200),
  whyNow: trimmed(8, 160),
  claims: z.array(claimSchema).min(1).max(8),
  requestedFee: z.number().positive().finite().max(1),
  wordCount: z.number().int().positive().max(2000),
});

export const assignmentSchema = z.object({
  pitchId: z.string().trim().min(2).max(120),
  agentId: z.string().trim().min(2).max(80),
  beat: beatSchema,
  wordCount: z.number().int().positive().max(2000),
  fee: z.number().positive().finite().max(1),
});

export const rejectedPitchSchema = z.object({
  pitchId: z.string().trim().min(2).max(120),
  reason: trimmed(4, 120),
});

export const draftSchema = z.object({
  assignmentId: z.string().trim().min(2).max(120),
  pitchId: z.string().trim().min(2).max(120),
  agentId: z.string().trim().min(2).max(80),
  headline: trimmed(8, 90),
  dek: trimmed(8, 180),
  bodyMarkdown: trimmed(100, 20000),
  claims: z.array(claimSchema).min(1).max(20),
  wordCount: z.number().int().positive().max(3000),
});

export const factCheckCheckSchema = z.object({
  claim: trimmed(5, 500),
  sourceId: z.string().trim().min(2).max(80),
  verdict: z.enum(["supported", "unsupported", "needs_context"]),
  note: trimmed(2, 160),
});

export const factCheckSchema = z.object({
  draftId: z.string().trim().min(2).max(120),
  checks: z.array(factCheckCheckSchema).min(1).max(20),
  overall: z.enum(["pass", "revise"]),
});

export const storySchema = z.object({
  id: z.string().trim().min(2).max(120),
  pitch: pitchSchema,
  assignment: assignmentSchema,
  draft: draftSchema,
  factCheck: factCheckSchema,
  revisedDraft: draftSchema.optional(),
  recheck: factCheckSchema.optional(),
});

export const ledgerEntrySchema = z.object({
  id: z.string().trim().min(2),
  editionId: z.string().trim().min(2),
  type: z.enum(["reader_payment", "agent_payout"]),
  kind: z.enum(["transfer", "retained", "local"]),
  agentId: z.string().optional(),
  role: z.enum(["editor", "reporter", "fact_checker", "treasury"]).optional(),
  from: z.string().trim().min(2),
  to: z.string().trim().min(2),
  amount: z.number().nonnegative().finite(),
  txHash: z.string().optional(),
  explorerUrl: z.string().url().optional(),
  status: z.enum(["pending", "confirmed", "failed", "local"]),
  note: z.string().max(300).optional(),
});

export const editionSchema = z.object({
  id: z.string().trim().min(2),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["drafting", "reviewing", "published", "paid"]),
  stories: z.array(storySchema).min(1).max(3),
  editorNote: z.string().trim().max(300),
  selectionNote: z.string().trim().max(300),
  frontPageOrder: z.array(z.string().trim().min(2)).min(1).max(3),
  pullQuote: z.string().trim().max(160),
  readerPayment: ledgerEntrySchema.optional(),
  payouts: z.array(ledgerEntrySchema),
  totalRevenue: z.number().nonnegative().finite(),
  createdAt: z.string().datetime(),
});

/* ---------- Raw LLM response schemas (snake_case, exactly as prompted) ---------- */

export const pitchResponseSchema = z.object({
  headline: trimmed(8, 90),
  angle: trimmed(8, 200),
  why_now: trimmed(8, 160),
  claims: z
    .array(
      z.object({
        text: trimmed(8, 500),
        source_id: z.string().trim().min(2).max(80),
      }),
    )
    .min(3)
    .max(5),
  requested_fee: z.number().positive().finite(),
  word_count: z.number().int().positive(),
});

export const selectionResponseSchema = z.object({
  selected: z
    .array(
      z.object({
        pitch_id: z.string().trim().min(2),
        reporter_id: z.string().trim().min(2),
        word_count: z.number().int().positive(),
        fee: z.number().positive().finite(),
      }),
    )
    .length(2),
  rejected: z
    .array(
      z.object({
        pitch_id: z.string().trim().min(2),
        reason: trimmed(4, 120),
      }),
    )
    .length(1),
  total_cost: z.number().nonnegative().finite(),
  editor_note: trimmed(8, 160),
});

export const draftResponseSchema = z.object({
  headline: trimmed(8, 90),
  dek: trimmed(8, 180),
  body_markdown: trimmed(100, 20000),
  claims: z
    .array(
      z.object({
        text: trimmed(8, 500),
        source_id: z.string().trim().min(2).max(80),
      }),
    )
    .min(1)
    .max(20),
});

export const factCheckResponseSchema = z.object({
  checks: z
    .array(
      z.object({
        claim: trimmed(5, 500),
        source_id: z.string().trim().min(2).max(80),
        verdict: z.enum(["supported", "unsupported", "needs_context"]),
        note: trimmed(2, 160),
      }),
    )
    .min(1)
    .max(20),
  overall: z.enum(["pass", "revise"]),
});

export const editorNoteResponseSchema = z.object({
  editor_note: trimmed(8, 220),
  front_page_order: z.array(z.string().trim().min(2)).length(2),
  pull_quote: trimmed(12, 140),
});
