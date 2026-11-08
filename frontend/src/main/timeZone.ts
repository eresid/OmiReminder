/**
 * Follows the OS time zone in the main process (FR-NOT-1b).
 *
 * Node reads the time zone once at startup and does not notice when Windows changes it, so local
 * dates in this process would stay in the old zone. Chromium does notice it in the renderer, which
 * reports the current IANA zone. Setting `TZ` makes Node use that zone for `Date` and `Intl` at once.
 */
export function applyTimeZone(timeZone: string, env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.TZ === timeZone) {
    return false;
  }
  env.TZ = timeZone;
  return true;
}
