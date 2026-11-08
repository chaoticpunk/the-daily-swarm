/** Server-side structured logs go to stderr so CLI JSON on stdout stays clean. */
export function logServerEvent(event: Record<string, unknown>): void {
  try {
    process.stderr.write(`${JSON.stringify(event)}\n`);
  } catch {
    // Logging must never break an agent step.
  }
}
