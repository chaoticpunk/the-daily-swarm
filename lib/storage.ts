import { editionSchema } from "@/lib/agents/schemas";
import type { Edition, LedgerEntry } from "@/lib/types";

const EDITION_PREFIX = "daily-swarm:edition:";
const INDEX_KEY = "daily-swarm:edition-index";
const PENDING_PAYMENT_KEY = "daily-swarm:pending-payment";

export interface EditionIndexEntry {
  id: string;
  date: string;
  status: Edition["status"];
  createdAt: string;
  storyCount: number;
  editorNote: string;
  totalRevenue: number;
}

export interface PendingPayment {
  editionId: string;
  senderAccountId: string;
  startedAt: string;
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const probe = "__daily_swarm_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJson<T>(key: string): T | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function getEdition(id: string): Edition | null {
  const raw = readJson<unknown>(`${EDITION_PREFIX}${id}`);
  if (!raw) return null;
  const parsed = editionSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function saveEdition(edition: Edition): boolean {
  const parsed = editionSchema.safeParse(edition);
  if (!parsed.success) {
    console.error("Refusing to save an invalid edition.", parsed.error.issues.length);
    return false;
  }
  const saved = writeJson(`${EDITION_PREFIX}${edition.id}`, parsed.data);
  if (!saved) return false;

  const index = listEditionIndex().filter((item) => item.id !== edition.id);
  index.unshift({
    id: edition.id,
    date: edition.date,
    status: edition.status,
    createdAt: edition.createdAt,
    storyCount: edition.stories.length,
    editorNote: edition.editorNote,
    totalRevenue: edition.totalRevenue,
  });
  writeJson(INDEX_KEY, index.slice(0, 40));
  return true;
}

export function listEditionIndex(): EditionIndexEntry[] {
  const raw = readJson<unknown>(INDEX_KEY);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is EditionIndexEntry => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<EditionIndexEntry>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.date === "string" &&
        typeof candidate.createdAt === "string"
      );
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listEditions(): Edition[] {
  return listEditionIndex()
    .map((item) => getEdition(item.id))
    .filter((edition): edition is Edition => Boolean(edition));
}

export function listLedgerEntries(): LedgerEntry[] {
  const entries = listEditions().flatMap((edition) => [
    ...(edition.readerPayment ? [edition.readerPayment] : []),
    ...edition.payouts,
  ]);
  return entries.sort((a, b) => {
    const aKey = a.txHash ?? a.id;
    const bKey = b.txHash ?? b.id;
    return aKey.localeCompare(bKey);
  });
}

export function setPendingPayment(pending: PendingPayment): void {
  writeJson(PENDING_PAYMENT_KEY, pending);
}

export function getPendingPayment(): PendingPayment | null {
  const raw = readJson<PendingPayment>(PENDING_PAYMENT_KEY);
  if (!raw || typeof raw.editionId !== "string" || typeof raw.senderAccountId !== "string") {
    return null;
  }
  return raw;
}

export function clearPendingPayment(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(PENDING_PAYMENT_KEY);
  } catch {
    // ignore
  }
}

export function clearArchive(): void {
  const store = storage();
  if (!store) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key && key.startsWith(EDITION_PREFIX)) keys.push(key);
    }
    for (const key of keys) store.removeItem(key);
    store.removeItem(INDEX_KEY);
    store.removeItem(PENDING_PAYMENT_KEY);
  } catch {
    // ignore
  }
}
