import Link from "next/link";
import { getAgentConfig } from "@/lib/config";
import type { Edition, Story } from "@/lib/types";
import { BEAT_STYLE } from "@/lib/ui/beat-style";
import { cn } from "@/lib/utils";

function storyFactStatus(story: Story): "passed" | "revised" | "unresolved" | "unchecked" {
  if (story.recheck) {
    return story.recheck.overall === "pass" ? "revised" : "unresolved";
  }
  if (story.factCheck.overall === "pass") return "passed";
  return story.revisedDraft ? "revised" : "unchecked";
}

const FACT_LABEL: Record<ReturnType<typeof storyFactStatus>, string> = {
  passed: "Fact-check passed",
  revised: "Revised · re-checked",
  unresolved: "Unresolved fact-check flag",
  unchecked: "Fact-check: revision requested",
};

export function FrontPagePreview({
  edition,
  phase,
  editorNote,
  pullQuote,
  storageError,
}: {
  edition: Edition | null;
  phase: "idle" | "running" | "published" | "error";
  editorNote: string;
  pullQuote: string;
  storageError?: string;
}) {
  if (!edition) {
    return (
      <section aria-labelledby="front-page-heading" className="paper-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-ink pb-3">
          <h2 id="front-page-heading" className="font-headline text-2xl font-bold">
            Today&apos;s front page
          </h2>
          <p className="news-caps text-[10px] text-ink-soft">
            {phase === "running" ? "In production" : "Awaiting commission"}
          </p>
        </div>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
          {phase === "running"
            ? "The front page fills after the editor sets the order and writes the note. Nothing is pre-written."
            : phase === "error"
              ? "The edition stopped before press. Fix the stalled stage and retry; the front page stays open until an edition completes."
              : "Produce today's edition to fill these two slots with sourced stories. The desks write only after the editor commissions them."}
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {[1, 2].map((slot) => (
            <div key={slot} className="border-t-2 border-rule pt-3">
              <p className="news-caps text-[10px] text-accent-deep">
                Story slot {String(slot).padStart(2, "0")}
              </p>
              <p className="font-headline mt-2 text-2xl leading-tight text-ink/35">
                Awaiting commission
              </p>
              <div className="mt-3 space-y-2" aria-hidden="true">
                <div className="h-px w-full bg-rule-soft" />
                <div className="h-px w-11/12 bg-rule-soft" />
                <div className="h-px w-4/5 bg-rule-soft" />
                <div className="h-px w-2/3 bg-rule-soft" />
              </div>
              <p className="mt-3 text-xs text-ink-soft">
                Reporter, fee, word count, and source ids will be visible on the
                edition.
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const ordered = edition.frontPageOrder
    .map((id) => edition.stories.find((story) => story.id === id))
    .filter((story): story is Story => Boolean(story));

  return (
    <section aria-labelledby="front-page-heading" className="paper-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-ink pb-3">
        <h2 id="front-page-heading" className="font-headline text-2xl font-bold">
          Today&apos;s front page
        </h2>
        <p className="news-caps text-[10px] text-success">Edition published</p>
      </div>

      <div className="mt-5 space-y-7">
        {ordered.map((story, index) => {
          const agent = getAgentConfig(story.assignment.agentId);
          const status = storyFactStatus(story);
          const finalDraft = story.revisedDraft ?? story.draft;
          return (
            <article key={story.id} className={cn(index > 0 && "border-t border-rule pt-6")}>
              <p className="news-caps flex flex-wrap items-center gap-1.5 text-[10px] text-accent-deep">
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    BEAT_STYLE[story.assignment.beat].dot,
                  )}
                />
                {agent?.desk ?? "Desk"} · {story.assignment.wordCount} words ·{" "}
                {story.assignment.fee.toFixed(2)} NEAR
              </p>
              <h3 className="font-headline mt-1.5 text-[1.65rem] leading-[1.08] font-bold sm:text-3xl">
                {finalDraft.headline}
              </h3>
              <p className="font-headline mt-2 text-base leading-snug text-ink-soft italic">
                {finalDraft.dek}
              </p>
              <p className="mt-2 text-xs">
                By {agent?.name ?? "the desk"}{" "}
                <span className="text-ink-soft">· {agent?.beat ?? "newsroom"} desk</span>
              </p>
              <p
                className={cn(
                  "news-caps mt-2 inline-block px-2 py-1 text-[10px]",
                  status === "unresolved"
                    ? "bg-accent/10 text-accent-deep"
                    : "bg-success/10 text-success",
                )}
              >
                {FACT_LABEL[status]}
              </p>
            </article>
          );
        })}
      </div>

      <div className="mt-6 border-t-2 border-ink pt-4">
        <p className="news-caps text-[10px] text-ink-soft">Editor&apos;s note</p>
        <p className="font-headline mt-2 text-lg leading-snug">{editorNote}</p>
        {pullQuote ? (
          <blockquote className="mt-4 border-l-2 border-accent pl-3">
            <p className="font-headline text-xl leading-snug font-bold italic">
              “{pullQuote}”
            </p>
          </blockquote>
        ) : null}
      </div>

      {storageError ? (
        <p role="alert" className="mt-4 border-l-2 border-accent pl-2 text-xs text-accent-deep">
          {storageError}
        </p>
      ) : null}

      <Link
        href={`/edition/${edition.id}`}
        className="news-caps mt-5 inline-flex items-center gap-3 bg-ink px-5 py-3 text-[11px] text-newsprint transition-colors hover:bg-accent-deep"
      >
        Open the edition · reader access 1 NEAR{" "}
        <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
