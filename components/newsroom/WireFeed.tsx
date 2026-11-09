"use client";

import { useEffect, useRef } from "react";
import { getAgentConfig } from "@/lib/config";
import type { WireEvent, WireEventKind } from "@/lib/types";
import { BEAT_STYLE } from "@/lib/ui/beat-style";
import { cn } from "@/lib/utils";

const DOT: Record<WireEventKind, string> = {
  open: "bg-newsprint/40",
  pitch: "bg-gold",
  commission: "bg-[#8ac79a]",
  pass: "bg-[#8f8674]",
  draft: "bg-newsprint",
  check: "bg-[#8ac79a]",
  revision: "bg-gold",
  recheck: "bg-[#8ac79a]",
  publish: "bg-accent",
  stop: "bg-accent",
};

function wireTime(at: number): string {
  return new Date(at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function WireFeed({
  events,
  running,
}: {
  events: WireEvent[];
  running: boolean;
}) {
  const feedRef = useRef<HTMLDivElement>(null);
  const wasRunning = useRef(running);

  useEffect(() => {
    const node = feedRef.current;
    if (!node) return;
    // Follow the latest dispatch while the edition is running; once it is
    // published, return to the top so the wire reads from the call to order.
    if (wasRunning.current && !running) {
      node.scrollTop = 0;
    } else {
      node.scrollTop = node.scrollHeight;
    }
    wasRunning.current = running;
  }, [events.length, running]);

  return (
    <section
      aria-labelledby="wire-heading"
      className="wire-panel mt-6 border border-ink bg-ink text-newsprint"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-newsprint/15 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              running
                ? "wire-pulse bg-accent"
                : events.length > 0
                  ? "bg-[#8ac79a]"
                  : "bg-newsprint/30",
            )}
          />
          <h3 id="wire-heading" className="news-caps text-[11px]">
            The wire
          </h3>
          <span className="news-caps text-[10px] text-newsprint/40">
            Live from the desk
          </span>
        </div>
        <p className="ledger-num text-[10px] text-newsprint/45">
          {events.length} {events.length === 1 ? "dispatch" : "dispatches"}
        </p>
      </div>

      <div
        ref={feedRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="max-h-[17.5rem] overflow-y-auto px-4 py-3"
      >
        {events.length === 0 ? (
          <div className="py-2">
            <p className="font-headline text-base leading-snug text-newsprint/60 italic">
              The wire is quiet. Produce an edition and each dispatch prints here
              as the desks file it.
            </p>
            <p className="ledger-num mt-2 text-[10px] leading-relaxed text-newsprint/40">
              No generated copy is pre-filled. Every line comes from an actual
              agent response.
            </p>
          </div>
        ) : (
          <ol className="space-y-3">
            {events.map((event) => {
              const agent = event.agentId
                ? getAgentConfig(event.agentId)
                : undefined;
              return (
                <li
                  key={event.id}
                  className="wire-in grid grid-cols-[auto_1fr] gap-x-3"
                >
                  <div className="flex flex-col items-center pt-1.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        DOT[event.kind],
                      )}
                    />
                    <span
                      aria-hidden="true"
                      className="mt-1 w-px flex-1 bg-newsprint/10"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="ledger-num text-[10px] text-newsprint/40">
                        {wireTime(event.at)}
                      </span>
                      {agent?.beat ? (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "inline-block h-1.5 w-1.5 rounded-full",
                            BEAT_STYLE[agent.beat].wireDot,
                          )}
                        />
                      ) : null}
                      <span className="news-caps text-[10px] text-[#e4d9bf]">
                        {agent?.name ?? "The newsroom"}
                      </span>
                      {agent ? (
                        <span className="news-caps text-[10px] text-newsprint/30">
                          {agent.desk}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-sm leading-snug text-newsprint">
                      {event.message}
                    </p>
                    {event.detail ? (
                      <p className="ledger-num mt-0.5 text-[11px] leading-relaxed text-newsprint/45">
                        {event.detail}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
