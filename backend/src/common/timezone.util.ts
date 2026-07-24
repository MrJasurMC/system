/**
 * Timezone-aware "next daily reset" helper.
 *
 * Quests reset at 5:00 AM in the *user's* local timezone (Tashkent, Moscow,
 * etc. all have their own 5:00 AM at different real-world instants), not a
 * fixed UTC offset or "24h after claim". This avoids relying on any external
 * tz library — Intl.DateTimeFormat already knows the IANA database.
 */

const RESET_HOUR = 5;

function offsetMsAt(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(instant).reduce<Record<string, string>>((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  const hour = parts.hour === '24' ? 0 : Number(parts.hour);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - instant.getTime();
}

/**
 * Returns the next real UTC instant at which it is RESET_HOUR:00 in
 * `timeZone`, strictly after `from`. Handles DST by refining the offset
 * once against the target date itself (covers regions that observe it;
 * a no-op for Tashkent/Moscow which don't).
 */
export function nextLocalResetTime(timeZone: string, from: Date = new Date()): Date {
  const offsetMs = offsetMsAt(from, timeZone);
  const localNowAsUtc = new Date(from.getTime() + offsetMs);

  let candidate = new Date(Date.UTC(
    localNowAsUtc.getUTCFullYear(),
    localNowAsUtc.getUTCMonth(),
    localNowAsUtc.getUTCDate(),
    RESET_HOUR, 0, 0, 0,
  ));
  if (localNowAsUtc.getTime() >= candidate.getTime()) {
    candidate = new Date(candidate.getTime() + 24 * 3600 * 1000);
  }

  // Refine: re-derive the offset near the candidate date (DST-safe) and
  // convert the wall-clock candidate back into a real UTC instant.
  const refinedOffset = offsetMsAt(new Date(candidate.getTime() - offsetMs), timeZone);
  return new Date(candidate.getTime() - refinedOffset);
}

/**
 * The day of week (0=Sun ... 6=Sat), evaluated in `timeZone` rather than the
 * server's own local time. Quest generation (boss-weekend detection, rest
 * days, workout-split scheduling) must agree with `nextLocalResetTime` about
 * what "today" is, or a server running in a different offset than the
 * player's `character.timezone` can flip to Sat/Sun (or any other day)
 * hours before/after it actually does for the player — e.g. retiring the
 * Main quest for "boss weekend" while it's still a normal training day
 * locally, with no replacement quest generated.
 */
export function localDayOfWeek(timeZone: string, from: Date = new Date()): number {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' });
  const weekday = dtf.format(from); // "Sun", "Mon", ...
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday];
}

/** Common regions we expect players from — extend freely, any IANA zone works. */
export const TIMEZONE_PRESETS: { label: string; value: string }[] = [
  { label: 'Tashkent (UTC+5)', value: 'Asia/Tashkent' },
  { label: 'Moscow (UTC+3)', value: 'Europe/Moscow' },
  { label: 'Almaty (UTC+6)', value: 'Asia/Almaty' },
  { label: 'Istanbul (UTC+3)', value: 'Europe/Istanbul' },
  { label: 'London (UTC+0/+1)', value: 'Europe/London' },
  { label: 'New York (UTC-5/-4)', value: 'America/New_York' },
  { label: 'Los Angeles (UTC-8/-7)', value: 'America/Los_Angeles' },
];
