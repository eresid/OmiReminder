/** How often the renderer checks the OS time zone. Chromium may slow this down while the window is hidden. */
export const TIME_ZONE_CHECK_INTERVAL_MS = 15_000;

export interface TimeZoneWatcherOptions {
  report: (timeZone: string) => Promise<void>;
  readTimeZone?: () => string;
  intervalMs?: number;
}

function currentTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Reports the OS time zone to the main process at start and after every change (FR-NOT-1b).
 * Chromium updates the zone of the renderer when Windows changes it; Node in the main process
 * does not. Returns a function that stops watching.
 */
export function startTimeZoneWatcher({
  report,
  readTimeZone = currentTimeZone,
  intervalMs = TIME_ZONE_CHECK_INTERVAL_MS,
}: TimeZoneWatcherOptions): () => void {
  let reported: string | null = null;

  function check(): void {
    const timeZone = readTimeZone();
    if (timeZone === reported) {
      return;
    }
    reported = timeZone;
    report(timeZone).catch((error: unknown) => {
      // Try again on the next check.
      reported = null;
      console.error(error);
    });
  }

  check();
  const timer = window.setInterval(check, intervalMs);
  window.addEventListener("focus", check);
  document.addEventListener("visibilitychange", check);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", check);
    document.removeEventListener("visibilitychange", check);
  };
}
