"use client";

import type { ApiErrorBody, StageId, StageState } from "@/lib/types";
import { cn, formatDuration } from "@/lib/utils";

const STATUS_LABEL: Record<StageState["status"], string> = {
  idle: "Waiting",
  running: "Working",
  done: "Complete",
  skipped: "Not needed",
  error: "Stopped",
};

const SYMBOL: Record<StageState["status"], string> = {
  idle: "○",
  running: "◉",
  done: "✓",
  skipped: "—",
  error: "!",
};

export function RunProgress({
  stages,
  phase,
  activeStage,
  runError,
  onRetry,
  onReset,
}: {
  stages: StageState[];
  phase: "idle" | "running" | "published" | "error";
  activeStage?: StageId;
  runError?: ApiErrorBody["error"];
  onRetry: () => void;
  onReset: () => void;
}) {
  const active = stages.find((stage) => stage.id === activeStage);
  const runningText =
    phase === "running" && active
      ? `Producing the edition: ${active.label}. This usually takes under a minute.`
      : phase === "published"
        ? "Edition published. All stages completed."
        : phase === "error"
          ? "The edition stopped at this stage. Nothing after it was written."
          : "No edition in progress.";

  return (
    <section aria-labelledby="run-progress-heading" className="mt-6 border-y border-rule py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="run-progress-heading" className="news-caps text-[10px] text-accent-deep">
          Edition workflow
        </h3>
        <p className="ledger-num text-[10px] text-ink-soft">
          {stages.filter((stage) => stage.status === "done").length} of{" "}
          {stages.length} stages
        </p>
      </div>
      <p className="sr-only" aria-live="polite">
        {runningText}
      </p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {stages.map((stage) => (
          <li
            key={stage.id}
            className={cn(
              "border px-2.5 py-2",
              stage.status === "error"
                ? "border-accent bg-accent/5"
                : stage.status === "running"
                  ? "border-gold bg-gold/20"
                  : stage.status === "done"
                    ? "border-success/40 bg-success/5"
                    : "border-rule-soft bg-newsprint",
            )}
          >
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  "ledger-num text-[11px]",
                  stage.status === "running" && "run-progress-pulse text-accent-deep",
                  stage.status === "error" && "text-accent",
                  stage.status === "done" && "text-success",
                  stage.status === "skipped" && "text-ink-soft",
                  stage.status === "idle" && "text-ink-soft",
                )}
              >
                {SYMBOL[stage.status]}
              </span>
              <span className="news-caps text-[8px] leading-tight">{stage.label}</span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-[9px] text-ink-soft">
              <span>{STATUS_LABEL[stage.status]}</span>
              {stage.durationMs !== undefined ? (
                <span className="ledger-num">· {formatDuration(stage.durationMs)}</span>
              ) : null}
            </p>
            {stage.detail ? (
              <p className="mt-1 text-[9px] leading-snug text-ink-soft">{stage.detail}</p>
            ) : null}
          </li>
        ))}
      </ol>

      {phase === "error" && runError ? (
        <div
          role="alert"
          className="mt-4 border-l-4 border-accent bg-accent/5 p-4"
        >
          <p className="news-caps text-[9px] text-accent-deep">
            Edition stopped
          </p>
          <p className="mt-1 text-sm font-semibold">{runError.message}</p>
          <p className="ledger-num mt-1 text-[10px] text-ink-soft">
            Code: {runError.code}
            {runError.retryable ? " · retryable" : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="news-caps bg-ink px-4 py-2 text-[10px] text-newsprint hover:bg-accent-deep"
            >
              Retry this stage
            </button>
            <button
              type="button"
              onClick={onReset}
              className="news-caps border border-ink px-4 py-2 text-[10px] hover:border-accent hover:text-accent-deep"
            >
              Start over
            </button>
          </div>
          <p className="mt-2 text-[10px] text-ink-soft">
            Retry re-runs this stage and the ones after it. Earlier results stay
            visible.
          </p>
        </div>
      ) : null}
    </section>
  );
}
