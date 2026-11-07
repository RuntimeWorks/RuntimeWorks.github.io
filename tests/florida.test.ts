import { describe, expect, it } from "vitest"
import { dayNumber, nextDue, showDate } from "../src/lib/florida"

describe("Florida next spore test", () => {
  it("matches the worked example printed on the page: 8 cycles of 60 minutes, last test Oct 6, 2026", () => {
    const r = nextDue({ last: "2026-10-06", cyclesPerDay: 8, minutesPerCycle: 60, type: "steam" })
    if (typeof r === "string") throw new Error(r)
    expect(r.perDay).toBe(480)
    expect(r.days).toBe(5)
    expect(showDate(r.dates.use)).toBe("Oct 11, 2026")
    expect(showDate(r.dates.week)).toBe("Oct 13, 2026")
    expect(showDate(r.dates.thirty)).toBe("Nov 5, 2026")
    expect(r.binding).toBe("use")
  })
  it("uses 7,200 minutes for dry heat and ethylene oxide", () => {
    for (const type of ["dry", "eto"] as const) {
      const r = nextDue({ last: "2026-10-06", cyclesPerDay: 8, minutesPerCycle: 60, type })
      if (typeof r === "string") throw new Error(r)
      expect(r.useLimit).toBe(7200)
      expect(r.days).toBe(15)
      expect(r.binding).toBe("week")
    }
  })
  it("lets the 30 days bind when the 7 days cannot (never: 7 < 30), so a light load is bound by the week", () => {
    const r = nextDue({ last: "2026-12-30", cyclesPerDay: 1, minutesPerCycle: 10, type: "steam" })
    if (typeof r === "string") throw new Error(r)
    expect(r.binding).toBe("week")
    expect(r.due).toBe("2027-01-06")
  })
  it("rounds a part day up and reaches the limit inside one day when use is heavy", () => {
    const r = nextDue({ last: "2026-03-07", cyclesPerDay: 50, minutesPerCycle: 60, type: "steam" })
    if (typeof r === "string") throw new Error(r)
    expect(r.rawDays).toBeCloseTo(0.8)
    expect(r.days).toBe(1)
    expect(r.due).toBe("2026-03-08")
  })
  it("is not moved by a daylight-saving change (US clocks went forward on 2026-03-08)", () => {
    const r = nextDue({ last: "2026-03-06", cyclesPerDay: 8, minutesPerCycle: 60, type: "steam" })
    if (typeof r === "string") throw new Error(r)
    expect(r.dates.use).toBe("2026-03-11")
    expect(r.dates.week).toBe("2026-03-13")
  })
  it("refuses impossible dates and non-positive numbers", () => {
    expect(dayNumber("2026-02-30")).toBeNull()
    expect(nextDue({ last: "", cyclesPerDay: 8, minutesPerCycle: 60, type: "steam" })).toBe("date")
    expect(nextDue({ last: "2026-10-06", cyclesPerDay: 0, minutesPerCycle: 60, type: "steam" })).toBe("numbers")
    expect(nextDue({ last: "2026-10-06", cyclesPerDay: 8, minutesPerCycle: Number.NaN, type: "steam" })).toBe("numbers")
  })
})
