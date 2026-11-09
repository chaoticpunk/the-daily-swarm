import { EDITOR_BUDGET, getAgentConfig } from "@/lib/config";
import type { Assignment, Pitch, RejectedPitch } from "@/lib/types";
import { beatStyle } from "@/lib/ui/beat-style";
import { cn, formatNear } from "@/lib/utils";

function reporter(agentId: string) {
  return getAgentConfig(agentId);
}

export function BidBoard({
  pitches,
  rejected,
  assignments,
  totalCost,
  selectionNote,
}: {
  pitches: Pitch[];
  rejected: RejectedPitch[];
  assignments: Assignment[];
  totalCost: number;
  selectionNote: string;
}) {
  const selected = new Set(assignments.map((assignment) => assignment.pitchId));
  const rejectionFor = new Map(rejected.map((item) => [item.pitchId, item.reason]));
  const committed = Math.min(totalCost / EDITOR_BUDGET, 1);

  return (
    <section aria-labelledby="bid-board-heading" className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="bid-board-heading" className="news-caps text-[11px] text-accent-deep">
          Pitch board
        </h3>
        <p className="ledger-num text-[11px] text-ink-soft">
          {pitches.length} pitches · {formatNear(totalCost)} / {EDITOR_BUDGET.toFixed(2)} NEAR commissioned
        </p>
      </div>
      <div className="mt-2 h-1.5 bg-newsprint-deep" aria-hidden="true">
        <div
          className="h-full bg-accent transition-[width] duration-500"
          style={{ width: `${committed * 100}%` }}
        />
      </div>
      {selectionNote ? (
        <p className="mt-2 border-l-2 border-gold pl-2 text-xs italic text-ink-soft">
          Editor&apos;s memo: {selectionNote}
        </p>
      ) : null}

      {pitches.length === 0 ? (
        <div className="paper-inset mt-3 p-4">
          <p className="font-headline text-base text-ink-soft">
            Pitches appear here as the three desks respond.
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Each pitch carries a headline, angle, sourced claims, fee, and word count.
          </p>
        </div>
      ) : (
        <ol className="mt-3 space-y-3" aria-live="polite">
          {pitches.map((pitch) => {
            const agent = reporter(pitch.agentId);
            const beat = beatStyle(agent?.beat);
            const isSelected = selected.has(pitch.id);
            const rejection = rejectionFor.get(pitch.id);
            return (
              <li
                key={pitch.id}
                className={cn(
                  "bid-card border bg-newsprint p-4",
                  isSelected
                    ? "border-accent shadow-[3px_3px_0_rgba(198,40,40,0.12)]"
                    : rejection
                      ? "border-rule opacity-75"
                      : "border-rule",
                )}
              >
                <div
                  className={cn("-mx-4 -mt-4 mb-3 h-1", beat?.bar ?? "bg-ink")}
                  aria-hidden="true"
                />
                <div className="flex items-start justify-between gap-3">
                  <p className="news-caps flex flex-wrap items-center gap-1.5 text-[10px] text-ink-soft">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "inline-block h-2 w-2 rounded-full",
                        beat?.dot ?? "bg-ink",
                      )}
                    />
                    {agent?.name ?? pitch.agentId} · {agent?.desk ?? "Reporter"}
                  </p>
                  <span
                    className={cn(
                      "news-caps shrink-0 px-2 py-1 text-[10px]",
                      isSelected
                        ? "bg-accent text-white"
                        : rejection
                          ? "bg-newsprint-deep text-ink-soft"
                          : "bg-gold/40 text-ink",
                    )}
                  >
                    {isSelected
                      ? assignmentLabel(assignments, pitch.id)
                      : rejection
                        ? "Passed"
                        : "Waiting"}
                  </span>
                </div>
                <h4 className="font-headline mt-2 text-xl leading-[1.15] font-bold">
                  {pitch.headline}
                </h4>
                <p className="font-headline mt-1 text-sm leading-snug text-ink-soft italic">
                  {pitch.angle}
                </p>
                <p className="mt-2 text-xs leading-relaxed">
                  <span className="news-caps text-[10px] text-accent-deep">Why now · </span>
                  {pitch.whyNow}
                </p>

                <details className="group mt-3 border-t border-rule-soft pt-2">
                  <summary className="news-caps cursor-pointer list-none text-[10px] text-ink-soft hover:text-accent-deep">
                    {pitch.claims.length} sourced claims{" "}
                    <span aria-hidden="true" className="group-open:hidden">
                      +
                    </span>
                  </summary>
                  <ul className="mt-2 space-y-1.5">
                    {pitch.claims.map((claim, index) => (
                      <li key={`${pitch.id}-claim-${index}`} className="text-xs leading-snug">
                        {claim.text}{" "}
                        <span className="ledger-num whitespace-nowrap text-[10px] text-accent-deep">
                          [{claim.sourceId}]
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-rule-soft pt-2">
                  <p className="ledger-num text-[11px]">
                    Fee {formatNear(pitch.requestedFee)} NEAR · {pitch.wordCount} words
                  </p>
                  {isSelected ? (
                    <p className="text-[11px] font-semibold text-success">Commissioned</p>
                  ) : rejection ? (
                    <p className="text-[11px] text-ink-soft">Passed: {rejection}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function assignmentLabel(assignments: Assignment[], pitchId: string): string {
  const assignment = assignments.find((item) => item.pitchId === pitchId);
  return assignment ? `Commissioned · ${assignment.fee.toFixed(2)}` : "Commissioned";
}
