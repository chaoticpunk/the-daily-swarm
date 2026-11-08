/**
 * Run one real edition from the CLI.
 *
 * This script never substitutes fixtures. If the LLM is not configured or a
 * schema fails twice, it exits non-zero and prints the error.
 *
 * Usage:
 *   npm run edition
 *   npm run edition > edition.json
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"], quiet: true });

import { randomUUID } from "node:crypto";
import { getReporterConfigs } from "@/lib/config";
import { sourcePack } from "@/lib/content/pack";
import {
  runEditorNoteStep,
  runFactCheckStep,
  runPitchStep,
  runReviseStep,
  runSelectionStep,
  runWriteStep,
} from "@/lib/agents/run";
import { publicLlmConfig } from "@/lib/llm/client";
import type {
  Draft,
  FactCheck,
  Pitch,
  Story,
} from "@/lib/types";
import { countWords } from "@/lib/utils";

async function main() {
  const readiness = publicLlmConfig();
  if (!readiness.configured) {
    console.error(
      "LLM_NOT_CONFIGURED: set NEARAI_CLOUD_API_KEY (or LLM_API_KEY / OPENAI_API_KEY) in .env.local.",
    );
    process.exitCode = 1;
    return;
  }

  console.error(`The Daily Swarm · CLI edition · ${sourcePack.editionDate}`);
  console.error(`Model: ${readiness.model} via ${readiness.providerHost}`);

  const pitches: Pitch[] = [];
  for (const reporter of getReporterConfigs()) {
    console.error(`Pitch · ${reporter.name} (${reporter.beat})`);
    const { pitch, meta } = await runPitchStep(reporter.id);
    console.error(
      `  ✓ ${pitch.headline} · ${pitch.requestedFee} NEAR · ${pitch.wordCount} words · ${meta.durationMs}ms`,
    );
    pitches.push(pitch);
  }

  console.error("Selection · editor");
  const { result: selection, meta: selectionMeta } = await runSelectionStep(pitches);
  console.error(
    `  ✓ ${selection.assignments.length} selected · ${selection.rejected.length} rejected · ${selection.totalCost} NEAR · ${selectionMeta.durationMs}ms`,
  );

  const drafts: Record<string, Draft> = {};
  for (const assignment of selection.assignments) {
    const pitch = pitches.find((item) => item.id === assignment.pitchId);
    if (!pitch) throw new Error(`Missing pitch ${assignment.pitchId}`);
    console.error(`Write · ${assignment.agentId}`);
    const { draft, meta } = await runWriteStep({ assignment, pitch });
    console.error(`  ✓ ${draft.wordCount} words · ${meta.durationMs}ms`);
    drafts[assignment.pitchId] = draft;
  }

  const factChecks: Record<string, FactCheck> = {};
  for (const assignment of selection.assignments) {
    const draft = drafts[assignment.pitchId];
    console.error(`Fact-check · ${assignment.agentId}`);
    const { factCheck, meta } = await runFactCheckStep({
      draft,
      beat: assignment.beat,
    });
    console.error(
      `  ✓ ${factCheck.overall} · ${factCheck.checks.length} checks · ${meta.durationMs}ms`,
    );
    factChecks[assignment.pitchId] = factCheck;
  }

  const revisedDrafts: Record<string, Draft> = {};
  const rechecks: Record<string, FactCheck> = {};
  for (const assignment of selection.assignments) {
    const draft = drafts[assignment.pitchId];
    const factCheck = factChecks[assignment.pitchId];
    if (factCheck.overall !== "revise") continue;
    console.error(`Revise · ${assignment.agentId}`);
    const { draft: revised, meta } = await runReviseStep({
      draft,
      factCheck,
      beat: assignment.beat,
    });
    console.error(`  ✓ ${revised.wordCount} words · ${meta.durationMs}ms`);
    revisedDrafts[assignment.pitchId] = revised;

    console.error(`Re-check · ${assignment.agentId}`);
    const { factCheck: recheck, meta: recheckMeta } = await runFactCheckStep({
      draft: revised,
      beat: assignment.beat,
    });
    console.error(
      `  ✓ ${recheck.overall} · ${recheck.checks.length} checks · ${recheckMeta.durationMs}ms`,
    );
    rechecks[assignment.pitchId] = recheck;
  }

  const stories: Story[] = selection.assignments.map((assignment) => {
    const pitch = pitches.find((item) => item.id === assignment.pitchId);
    const draft = drafts[assignment.pitchId];
    const factCheck = factChecks[assignment.pitchId];
    if (!pitch || !draft || !factCheck) {
      throw new Error(`Incomplete story for ${assignment.agentId}`);
    }
    return {
      id: pitch.id,
      pitch,
      assignment,
      draft,
      factCheck,
      revisedDraft: revisedDrafts[assignment.pitchId],
      recheck: rechecks[assignment.pitchId],
    };
  });

  console.error("Editor note · layout");
  const { result: editorResult, meta: editorMeta } = await runEditorNoteStep(stories);
  console.error(`  ✓ front page set · ${editorMeta.durationMs}ms`);

  const edition = {
    id: `edition-${sourcePack.editionDate}-${randomUUID().slice(0, 8)}`,
    date: sourcePack.editionDate,
    status: "published" as const,
    stories,
    editorNote: editorResult.editorNote,
    selectionNote: selection.selectionNote,
    frontPageOrder: editorResult.frontPageOrder,
    pullQuote: editorResult.pullQuote,
    payouts: [],
    totalRevenue: 0,
    createdAt: new Date().toISOString(),
  };

  const words = stories.reduce(
    (total, story) => total + countWords((story.revisedDraft ?? story.draft).bodyMarkdown),
    0,
  );
  console.error(`Edition complete · ${stories.length} stories · ${words} words`);

  process.stdout.write(`${JSON.stringify(edition, null, 2)}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`EDITION_FAILED: ${message}`);
  process.exitCode = 1;
});
