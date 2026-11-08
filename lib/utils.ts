import { EXPLORER_BASE } from "@/lib/config";
import type { AgentStatus } from "@/lib/types";

export const AGENT_STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "Ready",
  pitching: "Pitching",
  assigned: "Commissioned",
  writing: "Writing",
  reviewing: "Reviewing",
  done: "Done",
};

export function formatDuration(ms?: number): string {
  if (typeof ms !== "number" || !Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function formatNear(value: number, digits = 4): string {
  return value.toFixed(digits);
}

export function formatNearCompact(value: number): string {
  const digits = value >= 100 ? 2 : 4;
  return value.toFixed(digits);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function shortAccount(accountId: string, head = 10, tail = 6): string {
  if (accountId.length <= head + tail + 1) return accountId;
  return `${accountId.slice(0, head)}…${accountId.slice(-tail)}`;
}

export function shortHash(hash: string, head = 8, tail = 8): string {
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export function explorerTxUrl(hash: string): string {
  return `${EXPLORER_BASE}/transactions/${hash}`;
}

export function explorerAccountUrl(accountId: string): string {
  return `${EXPLORER_BASE}/accounts/${accountId}`;
}

export function countWords(markdown: string): number {
  const text = markdownToPlainText(markdown);
  if (!text) return 0;
  return text.split(" ").length;
}

export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[*_`~>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function markdownPreview(markdown: string, maxLength = 280): string {
  const text = markdownToPlainText(markdown);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function normalizeForQuote(value: string): string {
  return value
    .replace(/[*_`~>#]/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function quoteAppearsIn(quote: string, bodies: string[]): boolean {
  const normalized = normalizeForQuote(quote);
  if (normalized.length < 12) return false;
  return bodies.some((body) => normalizeForQuote(body).includes(normalized));
}

export function nearToFourDecimals(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function nearToYocto(value: number): bigint {
  const units = BigInt(Math.round(value * 10000));
  return units * 10n ** 20n;
}

export function yoctoToNear(value: bigint | string): number {
  return Number(BigInt(value)) / 1e24;
}

export function isValidTxHash(hash: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{43,64}$/.test(hash);
}

export function isValidAccountId(accountId: string): boolean {
  return /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/.test(accountId) &&
    accountId.length >= 2 &&
    accountId.length <= 64;
}

export function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export function editionDateLabel(date: string): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function shortDateLabel(date: string): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function timestampLabel(iso: string): string {
  const parsed = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(parsed);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function makeId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
