import { TZDate } from '@date-fns/tz';

/** Scheduled notifications target this local hour in the user's time zone. */
export const NOTIFICATION_SEND_HOUR = 9;

/** A missed monthly overview may still go out through this local day. */
export const OVERVIEW_LAST_CATCH_UP_DAY = 7;

/** Used for invoice processing when a user hasn't chosen a time zone. */
export const FALLBACK_TIME_ZONE = 'UTC';

// IANA names are "Area/Location" (or UTC). Runtimes also accept abbreviations
// like "EST" and fixed offsets like "+05:00", which have no daylight saving
// rules, so those are rejected.
const IANA_NAME = /^(?:UTC|[A-Za-z]+(?:\/[A-Za-z0-9_+-]+)+)$/;

/** The runtime's canonical name for an IANA time zone, or null if it isn't one. */
export function normalizeTimeZone(timeZone: string): string | null {
  if (!IANA_NAME.test(timeZone)) {
    return null;
  }

  try {
    const resolved = new Intl.DateTimeFormat('en-US', { timeZone }).resolvedOptions().timeZone;

    return IANA_NAME.test(resolved) ? resolved : null;
  } catch {
    return null;
  }
}

/** This browser's IANA time zone, or null when it can't be detected. */
export function getBrowserTimeZone(): string | null {
  try {
    return normalizeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return null;
  }
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

function parseDateKey(dateKey: string): [year: number, month: number, day: number] {
  const [year, month, day] = dateKey.split('-').map(Number);

  return [year, month, day];
}

/**
 * Date keys are calendar dates (yyyy-MM-dd) with no time zone. Arithmetic runs
 * on UTC fields so the server's own time zone can never shift a date.
 */
export function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = parseDateKey(dateKey);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Adds calendar months to a month key (yyyy-MM). */
export function addMonthsToMonthKey(monthKey: string, months: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));

  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}`;
}

export function toMonthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

/** The calendar date at `instant` in `timeZone`. */
export function toLocalDateKey(instant: Date, timeZone: string): string {
  const local = new TZDate(instant.getTime(), timeZone);

  return `${pad(local.getFullYear(), 4)}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`;
}

/** The instant a local wall-clock hour occurs on a calendar date. */
export function zonedTimeToInstant(dateKey: string, hour: number, timeZone: string): Date {
  const [year, month, day] = parseDateKey(dateKey);

  return new Date(new TZDate(year, month - 1, day, hour, 0, 0, 0, timeZone).getTime());
}

/** 9 a.m. on a calendar date in the user's time zone. */
export function getSendTime(dateKey: string, timeZone: string): Date {
  return zonedTimeToInstant(dateKey, NOTIFICATION_SEND_HOUR, timeZone);
}

export type ReminderSlot = {
  /** The local date whose 9 a.m. send is the most recent one due. */
  date: string;
  scheduledFor: Date;
};

/**
 * The most recent 9 a.m. reminder send that is due at `now`. Before 9 a.m. it
 * is yesterday's, so a run that resumes after an outage still sends it.
 */
export function getDueReminderSlot(now: Date, timeZone: string): ReminderSlot {
  const today = toLocalDateKey(now, timeZone);
  const todaySendTime = getSendTime(today, timeZone);

  if (now >= todaySendTime) {
    return { date: today, scheduledFor: todaySendTime };
  }

  const yesterday = addDaysToDateKey(today, -1);

  return { date: yesterday, scheduledFor: getSendTime(yesterday, timeZone) };
}

export type OverviewPeriod = {
  /** The new month (yyyy-MM) the overview is scheduled for. */
  month: string;
  previousMonth: string;
  /** 9 a.m. on the month's first local day. */
  scheduledFor: Date;
  /** Date range of the new month, end exclusive. */
  startDate: string;
  endDate: string;
  /** Date range of the previous month, end exclusive. */
  previousStartDate: string;
  previousEndDate: string;
};

export function getOverviewPeriod(month: string, timeZone: string): OverviewPeriod {
  const previousMonth = addMonthsToMonthKey(month, -1);
  const startDate = `${month}-01`;

  return {
    month,
    previousMonth,
    scheduledFor: getSendTime(startDate, timeZone),
    startDate,
    endDate: `${addMonthsToMonthKey(month, 1)}-01`,
    previousStartDate: `${previousMonth}-01`,
    previousEndDate: startDate,
  };
}

/**
 * Whether a month's overview may still be sent at `now`: from 9 a.m. on the
 * first through the end of local day 7.
 */
export function isOverviewSendable(month: string, now: Date, timeZone: string): boolean {
  const today = toLocalDateKey(now, timeZone);

  if (toMonthKey(today) !== month || Number(today.slice(8)) > OVERVIEW_LAST_CATCH_UP_DAY) {
    return false;
  }

  return now >= getOverviewPeriod(month, timeZone).scheduledFor;
}

/** The monthly overview that is due at `now`, if its send window is open. */
export function getDueOverviewPeriod(now: Date, timeZone: string): OverviewPeriod | null {
  const month = toMonthKey(toLocalDateKey(now, timeZone));

  return isOverviewSendable(month, now, timeZone) ? getOverviewPeriod(month, timeZone) : null;
}

/** A short zone name for display, e.g. "EDT" or "GMT+5:45". */
export function getTimeZoneAbbreviation(timeZone: string, at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(at);

  return parts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone;
}
