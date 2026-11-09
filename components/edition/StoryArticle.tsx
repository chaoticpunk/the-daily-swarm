import ReactMarkdown from "react-markdown";
import { getAgentConfig } from "@/lib/config";
import { getFactById } from "@/lib/content/pack";
import type { FactCheckVerdict, Story } from "@/lib/types";
import { BEAT_STYLE } from "@/lib/ui/beat-style";
import { cn, formatNear, markdownPreview } from "@/lib/utils";

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

function factStatus(story: Story): {
  label: string;
  tone: "ok" | "warn" | "bad";
} {
  if (story.recheck) {
    return story.recheck.overall === "pass"
      ? { label: "Revised once · re-check passed", tone: "ok" }
      : { label: "Unresolved fact-check flag", tone: "bad" };
  }
  if (story.factCheck.overall === "pass") {
    return { label: "Fact-check passed", tone: "ok" };
  }
  return story.revisedDraft
    ? { label: "Revised · re-check pending", tone: "warn" }
    : { label: "Revision requested", tone: "bad" };
}

export function StoryArticle({
  story,
  unlocked,
  order,
}: {
  story: Story;
  unlocked: boolean;
  order: number;
}) {
  const finalDraft = story.revisedDraft ?? story.draft;
  const agent = getAgentConfig(story.assignment.agentId);
  const status = factStatus(story);
  const finalCheck = story.recheck ?? story.factCheck;
  const supportedCount = finalCheck.checks.filter(
    (check) => check.verdict === "supported",
  ).length;
  const unsupportedCount = finalCheck.checks.filter(
    (check) => check.verdict === "unsupported",
  ).length;
  const contextCount = finalCheck.checks.filter(
    (check) => check.verdict === "needs_context",
  ).length;
  const sources = [
    ...new Map(
      finalDraft.claims
        .map((claim) => getFactById(claim.sourceId))
        .filter((fact): fact is NonNullable<typeof fact> => Boolean(fact))
        .map((fact) => [fact.id, fact]),
    ).values(),
  ];

  return (
    <article id={story.id} className="border-b-2 border-ink pb-8 last:border-b-0">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="news-caps flex flex-wrap items-center gap-1.5 text-[10px] text-accent-deep">
            <span
              aria-hidden="true"
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                BEAT_STYLE[story.assignment.beat].dot,
              )}
            />
            {order === 1 ? "Front page · lead story" : "Front page"} · {agent?.desk}
          </p>
          <p
            className={cn(
              "news-caps px-2 py-1 text-[10px]",
              status.tone === "ok" && "bg-success/10 text-success",
              status.tone === "warn" && "bg-gold/30 text-ink",
              status.tone === "bad" && "bg-accent/10 text-accent-deep",
            )}
          >
            {status.label}
          </p>
        </div>
        <h2 className="font-headline mt-3 text-[2rem] leading-[1.05] font-bold tracking-tight sm:text-[2.6rem]">
          {finalDraft.headline}
        </h2>
        <p className="font-headline mt-3 max-w-2xl text-lg leading-snug text-ink-soft italic sm:text-xl">
          {finalDraft.dek}
        </p>
        <p className="mt-4 text-xs">
          By <span className="font-semibold">{agent?.name ?? "the desk"}</span>{" "}
          <span className="text-ink-soft">
            · {agent?.beat ?? "newsroom"} desk · {finalDraft.wordCount} words ·{" "}
            {formatNear(story.assignment.fee)} NEAR assignment
          </span>
        </p>
      </header>

      {unlocked ? (
        <>
          <div className="article-body mt-6">
            <ReactMarkdown
              components={{
                a({ href, children }) {
                  return (
                    <a href={href} target="_blank" rel="noreferrer">
                      {children}
                    </a>
                  );
                },
              }}
            >
              {finalDraft.bodyMarkdown}
            </ReactMarkdown>
          </div>

          {status.tone === "bad" ? (
            <p
              role="note"
              className="mt-5 border-l-4 border-accent bg-accent/5 px-3 py-2 text-xs leading-relaxed text-accent-deep"
            >
              The fact-checker still flags this story after one revision. It is
              published with the flag visible, not presented as verified.
            </p>
          ) : null}

          <section
            aria-label="Standards desk fact-check"
            className="mt-6 border-t-2 border-ink pt-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div>
                <p className="news-caps text-[10px] text-accent-deep">
                  The standards desk
                </p>
                <p className="ledger-num mt-1 text-[10px] leading-snug text-ink-soft">
                  {finalCheck.checks.length} checks · {supportedCount} supported ·{" "}
                  {unsupportedCount} flagged
                  {contextCount > 0 ? ` · ${contextCount} need context` : ""}
                </p>
              </div>
              <span
                className={cn(
                  "stamp",
                  status.tone === "ok"
                    ? "text-success"
                    : status.tone === "warn"
                      ? "text-ink-soft"
                      : "text-accent",
                )}
              >
                {status.tone === "ok"
                  ? "Verified"
                  : status.tone === "warn"
                    ? "Re-check pending"
                    : "Flagged"}
              </span>
            </div>

            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {finalCheck.checks.map((check, index) => (
                <li key={`${story.id}-fc-${index}`} className="paper-inset p-2.5">
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "news-caps mt-0.5 shrink-0 px-1.5 py-0.5 text-[10px]",
                        VERDICT_STYLE[check.verdict],
                      )}
                    >
                      {VERDICT_LABEL[check.verdict]}
                    </span>
                    <p className="text-[11px] leading-snug">{check.claim}</p>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-snug text-ink-soft">
                    {check.note}{" "}
                    <span className="ledger-num text-accent-deep">
                      [{check.sourceId}]
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-4 grid gap-4 border-t border-rule pt-4 md:grid-cols-2">
            <details className="group">
              <summary className="news-caps cursor-pointer list-none text-[10px] text-ink-soft hover:text-accent-deep">
                Sources · {sources.length} cited{" "}
                <span aria-hidden="true" className="group-open:hidden">
                  +
                </span>
              </summary>
              <ul className="mt-3 space-y-2">
                {sources.map((source) => (
                  <li key={source.id} className="text-xs">
                    <a
                      href={source.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-accent-deep underline decoration-rule hover:decoration-accent"
                    >
                      {source.sourceTitle} ↗
                    </a>
                    <p className="ledger-num mt-0.5 text-[10px] text-ink-soft">
                      {source.id}
                    </p>
                  </li>
                ))}
              </ul>
            </details>

            <details className="group">
              <summary className="news-caps cursor-pointer list-none text-[10px] text-ink-soft hover:text-accent-deep">
                Every claim mapped to a source{" "}
                <span aria-hidden="true" className="group-open:hidden">
                  +
                </span>
              </summary>
              <ul className="mt-2 space-y-1.5">
                {finalDraft.claims.map((claim, index) => {
                  const fact = getFactById(claim.sourceId);
                  return (
                    <li
                      key={`${story.id}-claim-${index}`}
                      className="text-xs leading-snug"
                    >
                      {claim.text}{" "}
                      {fact ? (
                        <a
                          href={fact.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="ledger-num text-[10px] text-accent-deep underline decoration-rule"
                        >
                          [{claim.sourceId}] ↗
                        </a>
                      ) : (
                        <span className="ledger-num text-[10px] text-accent-deep">
                          [{claim.sourceId}]
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </details>
          </div>
        </>
      ) : (
        <div className="relative mt-6">
          <p className="font-headline max-w-2xl text-lg leading-relaxed text-ink/80">
            {markdownPreview(finalDraft.bodyMarkdown, 300)}
          </p>
          <div
            aria-hidden="true"
            className="pointer-events-none mt-2 max-h-24 select-none overflow-hidden blur-[4px]"
          >
            <p className="font-headline text-lg leading-relaxed">
              {markdownPreview(finalDraft.bodyMarkdown.slice(300), 300)}
            </p>
          </div>
          <p className="news-caps mt-2 text-[10px] text-accent-deep">
            Full text, sources, and fact-check report locked
          </p>
        </div>
      )}
    </article>
  );
}
