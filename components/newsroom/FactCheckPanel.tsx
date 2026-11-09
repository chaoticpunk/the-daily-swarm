import { getAgentConfig } from "@/lib/config";
import type {
  Assignment,
  Draft,
  FactCheck,
  FactCheckVerdict,
  Pitch,
} from "@/lib/types";
import { beatStyle } from "@/lib/ui/beat-style";
import { cn } from "@/lib/utils";

const VERDICT_LABEL: Record<FactCheckVerdict, string> = {
  supported: "Supported",
  unsupported: "Unsupported",
  needs_context: "Needs context",
};

const VERDICT_STYLE: Record<FactCheckVerdict, string> = {
  supported: "bg-success/10 text-success",
  unsupported: "bg-accent/10 text-accent-deep",
  needs_context: "bg-gold/30 text-ink",
};

function verdictCounts(factCheck: FactCheck) {
  return {
    supported: factCheck.checks.filter((check) => check.verdict === "supported").length,
    unsupported: factCheck.checks.filter((check) => check.verdict === "unsupported").length,
    needsContext: factCheck.checks.filter((check) => check.verdict === "needs_context").length,
  };
}

export function FactCheckPanel({
  assignments,
  pitches,
  drafts,
  factChecks,
  revisedDrafts,
  rechecks,
}: {
  assignments: Assignment[];
  pitches: Pitch[];
  drafts: Record<string, Draft>;
  factChecks: Record<string, FactCheck>;
  revisedDrafts: Record<string, Draft>;
  rechecks: Record<string, FactCheck>;
}) {
  return (
    <section aria-labelledby="standards-heading" className="mt-6">
      <div className="flex items-baseline justify-between gap-2">
        <h3 id="standards-heading" className="news-caps text-[11px] text-accent-deep">
          Standards desk
        </h3>
        <p className="text-[11px] text-ink-soft">Every claim mapped to a source</p>
      </div>

      {assignments.length === 0 ? (
        <div className="paper-inset mt-3 p-4">
          <p className="font-headline text-base text-ink-soft">
            The standards desk reviews drafts after the editor commissions them.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {assignments.map((assignment) => {
            const pitch = pitches.find((item) => item.id === assignment.pitchId);
            const draft = drafts[assignment.pitchId];
            const revised = revisedDrafts[assignment.pitchId];
            const check = factChecks[assignment.pitchId];
            const recheck = rechecks[assignment.pitchId];
            const agent = getAgentConfig(assignment.agentId);
            const beat = beatStyle(assignment.beat);
            const finalDraft = revised ?? draft;
            const finalCheck = recheck ?? check;
            const counts = finalCheck ? verdictCounts(finalCheck) : null;

            return (
              <article key={assignment.pitchId} className="paper-panel p-4">
                <div
                  className={cn("-mx-4 -mt-4 mb-3 h-1", beat?.bar ?? "bg-ink")}
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="news-caps flex flex-wrap items-center gap-1.5 text-[10px] text-ink-soft">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "inline-block h-2 w-2 rounded-full",
                          beat?.dot ?? "bg-ink",
                        )}
                      />
                      {agent?.name ?? assignment.agentId} · {assignment.beat} desk
                    </p>
                    <h4 className="font-headline mt-1 text-base leading-tight font-bold">
                      {pitch?.headline ?? "Assigned story"}
                    </h4>
                  </div>
                  <span
                    className={cn(
                      "news-caps shrink-0 px-2 py-1 text-[10px]",
                      !finalCheck
                        ? "bg-newsprint-deep text-ink-soft"
                        : finalCheck.overall === "pass"
                          ? "bg-success/10 text-success"
                          : "bg-accent/10 text-accent-deep",
                    )}
                  >
                    {!finalCheck
                      ? draft
                        ? "Awaiting check"
                        : "Awaiting draft"
                      : finalCheck.overall === "pass"
                        ? recheck
                          ? "Re-check passed"
                          : "Passed"
                        : recheck
                          ? "Unresolved flag"
                          : "Revision requested"}
                  </span>
                </div>

                <p className="ledger-num mt-2 text-[11px] text-ink-soft">
                  Fee {assignment.fee.toFixed(4)} NEAR · {assignment.wordCount} assigned
                  {finalDraft ? ` · ${finalDraft.wordCount} filed` : ""}
                </p>

                {counts ? (
                  <p className="mt-2 text-[11px]">
                    <span className="text-success">{counts.supported} supported</span>
                    {counts.unsupported > 0 ? (
                      <span className="text-accent-deep"> · {counts.unsupported} unsupported</span>
                    ) : null}
                    {counts.needsContext > 0 ? (
                      <span className="text-ink"> · {counts.needsContext} need context</span>
                    ) : null}
                  </p>
                ) : null}

                {finalCheck ? (
                  <details className="group mt-2 border-t border-rule-soft pt-2">
                    <summary className="news-caps cursor-pointer list-none text-[10px] text-ink-soft hover:text-accent-deep">
                      {finalCheck.checks.length} checks{" "}
                      <span aria-hidden="true" className="group-open:hidden">
                        +
                      </span>
                    </summary>
                    <ul className="mt-2 space-y-2">
                      {finalCheck.checks.map((item, index) => (
                        <li key={`${assignment.pitchId}-check-${index}`} className="text-xs">
                          <div className="flex items-start gap-2">
                            <span
                              className={cn(
                                "news-caps mt-0.5 shrink-0 px-1.5 py-0.5 text-[10px]",
                                VERDICT_STYLE[item.verdict],
                              )}
                            >
                              {VERDICT_LABEL[item.verdict]}
                            </span>
                            <p className="leading-snug">{item.claim}</p>
                          </div>
                          <p className="mt-0.5 pl-1 text-[11px] text-ink-soft">
                            {item.note}{" "}
                            <span className="ledger-num text-accent-deep">
                              [{item.sourceId}]
                            </span>
                          </p>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}

                {revised ? (
                  <p className="mt-2 border-l-2 border-gold pl-2 text-[11px] text-ink-soft">
                    Revised once after the fact-check
                    {recheck
                      ? recheck.overall === "pass"
                        ? " · re-check passed."
                        : " · re-check still flags a claim."
                      : "."}
                  </p>
                ) : check?.overall === "revise" ? (
                  <p className="mt-2 border-l-2 border-accent pl-2 text-[11px] text-accent-deep">
                    Reporter revision requested.
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
