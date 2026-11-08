import type { Agent } from "@/lib/types";
import {
  AGENT_STATUS_LABEL,
  cn,
  explorerAccountUrl,
  formatNearCompact,
  shortAccount,
} from "@/lib/utils";

const STATUS_STYLES: Record<Agent["status"], string> = {
  idle: "bg-newsprint-deep text-ink-soft",
  pitching: "bg-gold/40 text-ink",
  assigned: "bg-accent/10 text-accent-deep",
  writing: "bg-gold/40 text-ink",
  reviewing: "bg-gold/40 text-ink",
  done: "bg-success/10 text-success",
};

const ACTIVE_STATUSES = new Set<Agent["status"]>(["pitching", "writing", "reviewing"]);

export function AgentCard({
  agent,
  balancesState,
  committedFee,
}: {
  agent: Agent;
  balancesState: "idle" | "loading" | "ready" | "error";
  committedFee?: number;
}) {
  const initials = agent.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <article className="paper-panel flex h-full flex-col p-3">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "font-headline flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
            agent.role === "editor"
              ? "border-accent bg-accent text-white"
              : agent.role === "fact_checker"
                ? "border-ink bg-ink text-newsprint"
                : "border-rule bg-newsprint-deep text-ink",
          )}
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold leading-tight break-words">{agent.name}</h3>
          <p className="news-caps mt-1 text-[8px] text-ink-soft">{agent.desk}</p>
        </div>
        <span
          className={cn(
            "news-caps inline-flex shrink-0 items-center gap-1.5 px-2 py-1 text-[8px]",
            STATUS_STYLES[agent.status],
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full bg-current",
              ACTIVE_STATUSES.has(agent.status) && "run-progress-pulse",
            )}
          />
          {AGENT_STATUS_LABEL[agent.status]}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-rule-soft pt-2 text-[11px]">
        <div>
          <dt className="news-caps text-[8px] text-ink-soft">Balance</dt>
          <dd className="ledger-num mt-0.5">
            {balancesState === "loading" || balancesState === "idle" ? (
              <span className="text-ink-soft">reading…</span>
            ) : agent.balance === null ? (
              <span className="text-ink-soft">unavailable</span>
            ) : (
              `${formatNearCompact(agent.balance)} NEAR`
            )}
          </dd>
        </div>
        <div>
          <dt className="news-caps text-[8px] text-ink-soft">
            {agent.role === "reporter" ? "Editorial budget" : "Role budget"}
          </dt>
          <dd className="ledger-num mt-0.5">
            {agent.budget.toFixed(2)} NEAR
            {typeof committedFee === "number" && committedFee > 0 ? (
              <span className="text-accent-deep"> · {committedFee.toFixed(2)} commissioned</span>
            ) : null}
          </dd>
        </div>
      </dl>

      <a
        href={explorerAccountUrl(agent.accountId)}
        target="_blank"
        rel="noreferrer"
        className="ledger-num mt-2 block truncate text-[10px] text-ink-soft underline decoration-rule hover:text-accent-deep"
        title={`${agent.accountId} on the NEAR testnet explorer`}
      >
        {shortAccount(agent.accountId, 14, 5)}
      </a>
    </article>
  );
}
