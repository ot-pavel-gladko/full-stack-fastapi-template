import { expect, test } from "@playwright/test"
import { createUser } from "./utils/privateApi"
import { randomEmail, randomPassword, randomProjectName } from "./utils/random"
import {
  createProjectAs,
  createTimeEntryAs,
  getAccessToken,
} from "./utils/timeTrackingApi"
import { logInUser } from "./utils/user"

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function todayIso(): string {
  return toIso(new Date())
}

// Mirrors the backend's Monday-Sunday week range so we can pick a date
// that's inside the current month but guaranteed outside the current week.
function startOfWeek(reference: Date): Date {
  const day = (reference.getDay() + 6) % 7 // 0 = Monday
  const start = new Date(reference)
  start.setDate(reference.getDate() - day)
  return start
}

function inRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end
}

function dateWithinMonthButOutsideThisWeek(): string {
  const today = new Date()
  const weekStart = startOfWeek(today)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const candidates = [monthStart, monthEnd]
  for (const candidate of candidates) {
    if (!inRange(candidate, weekStart, weekEnd)) {
      return toIso(candidate)
    }
  }
  // Extremely unlikely fallback: the whole month sits inside this week.
  return toIso(monthStart)
}

test.describe("Hours Dashboard screen", () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  let email: string
  const password = randomPassword()
  let weekProjectName: string
  let monthOnlyProjectName: string

  test.beforeAll(async () => {
    email = randomEmail()
    await createUser({ email, password })

    const token = await getAccessToken(email, password)

    weekProjectName = randomProjectName()
    const weekProject = await createProjectAs(token, {
      name: weekProjectName,
      is_billable_default: true,
    })
    await createTimeEntryAs(token, {
      project_id: weekProject.id,
      entry_date: todayIso(),
      hours: "4",
      is_billable: true,
    })
    await createTimeEntryAs(token, {
      project_id: weekProject.id,
      entry_date: todayIso(),
      hours: "2",
      is_billable: false,
    })

    // An entry outside this week but within this month/quarter, on a
    // different project, so week vs month views diverge.
    monthOnlyProjectName = randomProjectName()
    const monthOnlyProject = await createProjectAs(token, {
      name: monthOnlyProjectName,
      is_billable_default: true,
    })
    await createTimeEntryAs(token, {
      project_id: monthOnlyProject.id,
      entry_date: dateWithinMonthButOutsideThisWeek(),
      hours: "10",
      is_billable: true,
    })
  })

  test.beforeEach(async ({ page }) => {
    await logInUser(page, email, password)
    await page.goto("/hours-dashboard")
  })

  test("Renders four metric cards with numeric values from the API", async ({
    page,
  }) => {
    await expect(page.getByTestId("metric-total-hours")).toContainText("6.00 h")
    await expect(page.getByTestId("metric-billable-hours")).toContainText(
      "4.00 h",
    )
    await expect(page.getByTestId("metric-non-billable-hours")).toContainText(
      "2.00 h",
    )
    await expect(page.getByTestId("metric-active-projects")).toBeVisible()
  })

  test("This week is selected by default on first load", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "This week" }),
    ).toHaveAttribute("aria-pressed", "true")
  })

  test("Hours by day chart renders one bar per day with logged time in the period", async ({
    page,
  }) => {
    await expect(page.getByTestId("hours-by-day-bar")).toHaveCount(1)
  })

  test("Per-project table lists only projects with logged time in the period", async ({
    page,
  }) => {
    await expect(
      page.getByRole("row", { name: new RegExp(weekProjectName) }),
    ).toBeVisible()
    await expect(
      page.getByRole("row", { name: new RegExp(monthOnlyProjectName) }),
    ).toHaveCount(0)
    await expect(
      page.getByRole("row", { name: new RegExp(weekProjectName) }),
    ).toContainText("6.00 h")
  })

  test("Clicking This month changes the metric-card values", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "This month" }).click()

    await expect(
      page.getByRole("button", { name: "This month" }),
    ).toHaveAttribute("aria-pressed", "true")
    await expect(page.getByTestId("metric-total-hours")).toContainText(
      "16.00 h",
    )
    await expect(
      page.getByRole("row", { name: new RegExp(monthOnlyProjectName) }),
    ).toBeVisible()
  })
})
