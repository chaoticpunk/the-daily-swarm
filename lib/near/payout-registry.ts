/**
 * Best-effort replay guard for treasury payouts.
 *
 * This is process memory, not a database. On serverless platforms a cold start
 * resets it; the README documents the limitation. Never rely on it as the only
 * protection when real money is involved.
 */
const claimedReaderTxHashes = new Set<string>();

export function claimPayout(readerTxHash: string): boolean {
  if (claimedReaderTxHashes.has(readerTxHash)) return false;
  claimedReaderTxHashes.add(readerTxHash);
  return true;
}

export function releasePayout(readerTxHash: string): void {
  claimedReaderTxHashes.delete(readerTxHash);
}

export function isPayoutClaimed(readerTxHash: string): boolean {
  return claimedReaderTxHashes.has(readerTxHash);
}
