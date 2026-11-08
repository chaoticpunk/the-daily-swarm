import { z } from "zod";
import {
  assignmentSchema,
  beatSchema,
  draftSchema,
  factCheckSchema,
  pitchSchema,
  storySchema,
} from "@/lib/agents/schemas";

export const pitchRequestSchema = z.object({
  agentId: z.string().trim().min(2).max(80),
});

export const selectRequestSchema = z.object({
  pitches: z.array(pitchSchema).length(3),
});

export const writeRequestSchema = z.object({
  assignment: assignmentSchema,
  pitch: pitchSchema,
});

export const factCheckRequestSchema = z.object({
  draft: draftSchema,
  beat: beatSchema,
});

export const reviseRequestSchema = z.object({
  draft: draftSchema,
  factCheck: factCheckSchema,
  beat: beatSchema,
});

export const editorNoteRequestSchema = z.object({
  stories: z.array(storySchema).length(2),
});

export const verifyPaymentRequestSchema = z.object({
  txHash: z.string().trim().min(20).max(100),
  senderAccountId: z.string().trim().min(2).max(64),
  editionId: z.string().trim().min(2).max(120),
});

export const payoutRequestSchema = z.object({
  editionId: z.string().trim().min(2).max(120),
  readerTxHash: z.string().trim().min(20).max(100),
  senderAccountId: z.string().trim().min(2).max(64),
  assignments: z.array(assignmentSchema).min(1).max(3),
});

export type PitchRequest = z.infer<typeof pitchRequestSchema>;
export type SelectRequest = z.infer<typeof selectRequestSchema>;
export type WriteRequest = z.infer<typeof writeRequestSchema>;
export type FactCheckRequest = z.infer<typeof factCheckRequestSchema>;
export type ReviseRequest = z.infer<typeof reviseRequestSchema>;
export type EditorNoteRequest = z.infer<typeof editorNoteRequestSchema>;
export type VerifyPaymentRequest = z.infer<typeof verifyPaymentRequestSchema>;
export type PayoutRequest = z.infer<typeof payoutRequestSchema>;
