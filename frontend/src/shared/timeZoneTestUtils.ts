/** Runs `work` with the process time zone set to `timeZone`, then restores it. */
export function withTimeZone<T>(timeZone: string, work: () => T): T {
  const previous = process.env.TZ;
  process.env.TZ = timeZone;
  try {
    return work();
  } finally {
    if (previous === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = previous;
    }
  }
}
