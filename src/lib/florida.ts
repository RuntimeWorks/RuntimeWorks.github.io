// When a Florida dental office's next spore test is due. The rule, unchanged from the live tool (2026-10):
// the earliest of (a) the day the sterilizer's use time reaches its limit since the last test, Florida Administrative
// Code 64B5-25.003: 40 hours (2,400 minutes) for steam and chemical vapor, 120 hours (7,200 minutes) for dry heat and
// ethylene oxide, use time = cycles × the individual cycle time; (b) 7 days, CDC's 2003 dental infection-control
// guidelines (at least weekly); (c) 30 days, the same Florida rule. Dates are calendar dates, computed in UTC so a
// daylight-saving change can never shift a day.

export type SterilizerType = "steam" | "vapor" | "dry" | "eto"
export interface Input { last: string; cyclesPerDay: number; minutesPerCycle: number; type: SterilizerType }
export type Binding = "use" | "week" | "thirty"
export interface Result {
  useLimit: number
  perDay: number
  rawDays: number
  days: number
  dates: Record<Binding, string>
  due: string
  binding: Binding
}

export const useLimit = (type: SterilizerType) => (type === "dry" || type === "eto" ? 7200 : 2400)

/** "YYYY-MM-DD" → days since 1970-01-01, or null if it is not a real date. */
export function dayNumber(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const t = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!)
  const d = new Date(t)
  if (d.getUTCFullYear() !== +m[1]! || d.getUTCMonth() !== +m[2]! - 1 || d.getUTCDate() !== +m[3]!) return null
  return t / 86_400_000
}
export const isoOf = (day: number) => new Date(day * 86_400_000).toISOString().slice(0, 10)
const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
/** "Oct 11, 2026", as the live tool printed dates. */
export const showDate = (iso: string) => fmt.format(new Date(`${iso}T00:00:00Z`))

export type Error = "date" | "numbers"
export function nextDue({ last, cyclesPerDay, minutesPerCycle, type }: Input): Result | Error {
  const start = dayNumber(last)
  if (start === null) return "date"
  if (!(cyclesPerDay > 0) || !(minutesPerCycle > 0)) return "numbers"
  const limit = useLimit(type)
  const perDay = cyclesPerDay * minutesPerCycle
  const rawDays = limit / perDay
  const days = Math.ceil(rawDays)
  const dates = { use: isoOf(start + days), week: isoOf(start + 7), thirty: isoOf(start + 30) }
  // Ties go to the use limit, then the 7 days, as on the live tool.
  const binding: Binding = dates.use <= dates.week && dates.use <= dates.thirty ? "use" : dates.week <= dates.thirty ? "week" : "thirty"
  return { useLimit: limit, perDay, rawDays, days, dates, due: dates[binding], binding }
}
