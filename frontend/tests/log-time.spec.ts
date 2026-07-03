import { expect, test } from "@playwright/test"
import { createUser } from "./utils/privateApi"
import {
  randomEmail,
  randomItemDescription,
  randomPassword,
  randomProjectName,
} from "./utils/random"
import {
  createProjectAs,
  createTimeEntryAs,
  getAccessToken,
  updateProjectStatusAs,
} from "./utils/timeTrackingApi"
import { logInUser } from "./utils/user"

test.describe("Log Time screen", () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  let email: string
  const password = randomPassword()
  let billableProjectName: string
  let nonBillableProjectName: string
  let archivedProjectName: string

  test.beforeAll(async () => {
    email = randomEmail()
    await createUser({ email, password })

    const token = await getAccessToken(email, password)

    billableProjectName = randomProjectName()
    await createProjectAs(token, {
      name: billableProjectName,
      is_billable_default: true,
    })

    nonBillableProjectName = randomProjectName()
    await createProjectAs(token, {
      name: nonBillableProjectName,
      is_billable_default: false,
    })

    archivedProjectName = randomProjectName()
    const archivedProject = await createProjectAs(token, {
      name: archivedProjectName,
      is_billable_default: true,
    })
    await updateProjectStatusAs(token, archivedProject.id, "archived")
  })

  test.beforeEach(async ({ page }) => {
    await logInUser(page, email, password)
    await page.goto("/log-time")
  })

  test("Log a new time entry successfully", async ({ page }) => {
    const description = randomItemDescription()

    await page.getByRole("combobox", { name: "Project" }).click()
    await page.getByRole("option", { name: billableProjectName }).click()
    await page.getByRole("spinbutton", { name: "Hours" }).fill("2.5")
    await page.getByLabel("Description").fill(description)
    await page.getByRole("button", { name: "Save entry" }).click()

    await expect(page.getByText("Time entry logged")).toBeVisible()
    const recentEntries = page.getByRole("row").filter({ hasText: description })
    await expect(recentEntries.first()).toBeVisible()
    await expect(recentEntries.first()).toContainText(billableProjectName)
  })

  test("Submitting without selecting a project shows a validation message", async ({
    page,
  }) => {
    await page.getByRole("spinbutton", { name: "Hours" }).fill("3")
    await page.getByRole("button", { name: "Save entry" }).click()

    await expect(
      page.getByText("Select a project", { exact: true }),
    ).toBeVisible()
  })

  test("Submitting without entering hours shows a validation message", async ({
    page,
  }) => {
    await page.getByRole("combobox", { name: "Project" }).click()
    await page.getByRole("option", { name: billableProjectName }).click()
    await page.getByRole("button", { name: "Save entry" }).click()

    await expect(page.getByText("Hours is required")).toBeVisible()
  })

  test("Selecting a billable-by-default project checks Billable automatically, and it can be unchecked", async ({
    page,
  }) => {
    await page.getByRole("combobox", { name: "Project" }).click()
    await page.getByRole("option", { name: billableProjectName }).click()

    const billableCheckbox = page.getByRole("checkbox", { name: "Billable" })
    await expect(billableCheckbox).toBeChecked()

    await billableCheckbox.click()
    await expect(billableCheckbox).not.toBeChecked()
  })

  test("Selecting a non-billable-by-default project leaves Billable unchecked", async ({
    page,
  }) => {
    await page.getByRole("combobox", { name: "Project" }).click()
    await page.getByRole("option", { name: nonBillableProjectName }).click()

    await expect(
      page.getByRole("checkbox", { name: "Billable" }),
    ).not.toBeChecked()
  })

  test("Archived projects do not appear in the Project select", async ({
    page,
  }) => {
    await page.getByRole("combobox", { name: "Project" }).click()
    await expect(
      page.getByRole("option", { name: billableProjectName }),
    ).toBeVisible()
    await expect(
      page.getByRole("option", { name: archivedProjectName }),
    ).toHaveCount(0)
  })

  test("Recent entries sorts by entry date, most recent first", async ({
    page,
  }) => {
    const token = await getAccessToken(email, password)
    const project = await createProjectAs(token, {
      name: randomProjectName(),
      is_billable_default: true,
    })
    const oldDescription = `old-entry-${Math.random().toString(36).substring(7)}`
    await createTimeEntryAs(token, {
      project_id: project.id,
      entry_date: "2020-01-01",
      hours: "1",
      description: oldDescription,
    })

    await page.goto("/log-time")

    await page.getByRole("combobox", { name: "Project" }).click()
    await page.getByRole("option", { name: billableProjectName }).click()
    await page.getByRole("spinbutton", { name: "Hours" }).fill("1.5")
    const description = randomItemDescription()
    await page.getByLabel("Description").fill(description)
    await page.getByRole("button", { name: "Save entry" }).click()

    await expect(page.getByText("Time entry logged")).toBeVisible()

    const rows = page.getByRole("row")
    const newEntryIndex = await rows.evaluateAll(
      (elements, text) =>
        elements.findIndex((el) => el.textContent?.includes(text)),
      description,
    )
    const oldEntryIndex = await rows.evaluateAll(
      (elements, text) =>
        elements.findIndex((el) => el.textContent?.includes(text)),
      oldDescription,
    )

    expect(newEntryIndex).toBeGreaterThan(-1)
    expect(oldEntryIndex).toBeGreaterThan(-1)
    expect(newEntryIndex).toBeLessThan(oldEntryIndex)
  })
})
