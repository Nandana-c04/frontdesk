/**
 * SLA Business Hours Engine
 *
 * Working hours: Mon-Fri, 09:30 - 18:30 (9 hours/day)
 * Excludes: weekends and holidays
 *
 * SLA Matrix:
 *   HIGH:   2 working hrs reply,  9 working hrs resolve  (same day)
 *   MEDIUM: 4.5 working hrs reply, 27 working hrs resolve (3 days)
 *   LOW:    9 working hrs reply,  45 working hrs resolve  (5 days)
 */

import { Priority } from "@prisma/client";

// Working hours constants (in minutes for precision)
const WORK_START_HOUR = 9;
const WORK_START_MINUTE = 30;
const WORK_END_HOUR = 18;
const WORK_END_MINUTE = 30;
const WORK_DAY_MINUTES = (WORK_END_HOUR * 60 + WORK_END_MINUTE) - (WORK_START_HOUR * 60 + WORK_START_MINUTE); // 540 min = 9 hrs

// SLA matrix in working minutes
export const SLA_MATRIX: Record<Priority, { replyMinutes: number; resolveMinutes: number }> = {
  HIGH:   { replyMinutes: 120,  resolveMinutes: 540  },   // 2 hrs, 9 hrs
  MEDIUM: { replyMinutes: 270,  resolveMinutes: 1620 },   // 4.5 hrs, 27 hrs
  LOW:    { replyMinutes: 540,  resolveMinutes: 2700 },   // 9 hrs, 45 hrs
};

/**
 * Check if a given date falls on a weekend (Saturday = 6, Sunday = 0)
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Convert a Date to minutes-since-midnight
 */
function toMinutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Get the start-of-work timestamp for a given date
 */
function workStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(WORK_START_HOUR, WORK_START_MINUTE, 0, 0);
  return d;
}

/**
 * Get the end-of-work timestamp for a given date
 */
function workEnd(date: Date): Date {
  const d = new Date(date);
  d.setHours(WORK_END_HOUR, WORK_END_MINUTE, 0, 0);
  return d;
}

/**
 * Advance a date to the next working day (skipping weekends and holidays)
 */
function nextWorkingDay(date: Date, holidayDates: Set<string>): Date {
  const d = new Date(date);
  do {
    d.setDate(d.getDate() + 1);
  } while (isWeekend(d) || holidayDates.has(toDateKey(d)));
  return d;
}

/**
 * Convert date to YYYY-MM-DD string for holiday lookup
 */
function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Calculate the deadline by adding `workingMinutes` of business time to `startDate`.
 * Skips weekends and holidays.
 *
 * If startDate is outside working hours, it snaps forward to the next working period start.
 */
export function addWorkingMinutes(
  startDate: Date,
  workingMinutes: number,
  holidayDates: Set<string> = new Set()
): Date {
  let remaining = workingMinutes;
  let current = new Date(startDate);

  // If on a weekend or holiday, snap to next working day start
  while (isWeekend(current) || holidayDates.has(toDateKey(current))) {
    current = workStart(nextWorkingDay(current, holidayDates));
  }

  const minuteOfDay = toMinutesOfDay(current);
  const workStartMin = WORK_START_HOUR * 60 + WORK_START_MINUTE;
  const workEndMin = WORK_END_HOUR * 60 + WORK_END_MINUTE;

  // If before work hours, snap to work start
  if (minuteOfDay < workStartMin) {
    current = workStart(current);
  }
  // If after work hours, snap to next working day start
  if (minuteOfDay >= workEndMin) {
    current = workStart(nextWorkingDay(current, holidayDates));
  }

  while (remaining > 0) {
    const endOfWorkToday = workEnd(current);
    const minutesLeftToday = Math.floor(
      (endOfWorkToday.getTime() - current.getTime()) / 60000
    );

    if (remaining <= minutesLeftToday) {
      // Fits within today
      current = new Date(current.getTime() + remaining * 60000);
      remaining = 0;
    } else {
      // Consume the rest of today, move to next working day
      remaining -= minutesLeftToday;
      current = workStart(nextWorkingDay(current, holidayDates));
    }
  }

  return current;
}

/**
 * Calculate elapsed working minutes between two dates, excluding weekends, holidays,
 * and time outside working hours.
 */
export function elapsedWorkingMinutes(
  start: Date,
  end: Date,
  holidayDates: Set<string> = new Set()
): number {
  if (end <= start) return 0;

  let elapsed = 0;
  let current = new Date(start);

  const workStartMin = WORK_START_HOUR * 60 + WORK_START_MINUTE;
  const workEndMin = WORK_END_HOUR * 60 + WORK_END_MINUTE;

  while (current < end) {
    // Skip non-working days
    if (isWeekend(current) || holidayDates.has(toDateKey(current))) {
      current = workStart(nextWorkingDay(current, holidayDates));
      continue;
    }

    const minuteOfDay = toMinutesOfDay(current);

    // Before work: snap to work start
    if (minuteOfDay < workStartMin) {
      current = workStart(current);
      continue;
    }

    // After work: snap to next working day
    if (minuteOfDay >= workEndMin) {
      current = workStart(nextWorkingDay(current, holidayDates));
      continue;
    }

    // Within working hours
    const endOfWorkToday = workEnd(current);
    const segmentEnd = end < endOfWorkToday ? end : endOfWorkToday;
    elapsed += Math.floor((segmentEnd.getTime() - current.getTime()) / 60000);

    if (end <= endOfWorkToday) {
      break;
    }
    current = workStart(nextWorkingDay(current, holidayDates));
  }

  return elapsed;
}

/**
 * Calculate SLA deadlines for a ticket based on priority and creation time.
 */
export function calculateSlaDeadlines(
  createdAt: Date,
  priority: Priority,
  holidayDates: Set<string> = new Set()
): { replyDeadline: Date; resolveDeadline: Date } {
  const sla = SLA_MATRIX[priority];
  return {
    replyDeadline: addWorkingMinutes(createdAt, sla.replyMinutes, holidayDates),
    resolveDeadline: addWorkingMinutes(createdAt, sla.resolveMinutes, holidayDates),
  };
}

/**
 * Recalculate SLA deadline proportionally when priority changes mid-flight.
 *
 * Formula: newRemaining = (remaining / oldTotal) × newTotal
 * New deadline = now + newRemaining working minutes
 */
export function recalculateSlaOnEscalation(
  now: Date,
  originalDeadline: Date,
  oldPriority: Priority,
  newPriority: Priority,
  field: "replyMinutes" | "resolveMinutes",
  pausedMinutes: number,
  holidayDates: Set<string> = new Set()
): Date {
  const oldTotal = SLA_MATRIX[oldPriority][field];
  const newTotal = SLA_MATRIX[newPriority][field];

  // Remaining working minutes until old deadline (from now)
  const remaining = elapsedWorkingMinutes(now, originalDeadline, holidayDates);
  const ratio = oldTotal > 0 ? remaining / oldTotal : 0;
  const newRemaining = Math.max(Math.round(ratio * newTotal), 0);

  return addWorkingMinutes(now, newRemaining, holidayDates);
}

/**
 * Check if a ticket has breached its SLA.
 */
export function isSlaBreached(
  deadline: Date | null,
  now: Date = new Date()
): boolean {
  if (!deadline) return false;
  return now > deadline;
}
