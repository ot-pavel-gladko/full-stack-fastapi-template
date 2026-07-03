import { expect, test } from "@playwright/test"
import { createUser } from "./utils/privateApi"
import {
  randomClientName,
  randomEmail,
  randomPassword,
  randomProjectName,
} from "./utils/random"
import { logInUser } from "./utils/user"

test.describe("Projects screen", () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  let email: string
  const password = randomPassword()

  test.beforeAll(async () => {
    email = randomEmail()
    await createUser({ email, password })
  })

  test.beforeEach(async ({ page }) => {
    await logInUser(page, email, password)
    await page.goto("/projects")
  })

  test("Shows empty state with New Project CTA when there are no projects", async ({
    page,
  }) => {
    await expect(
      page.getByText("You don't have any projects yet"),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "New Project" }).first(),
    ).toBeVisible()
  })

  test("Card view is the default and New Project button is visible", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: "Card view" }),
    ).toHaveAttribute("aria-pressed", "true")
    await expect(
      page.getByRole("button", { name: "New Project" }).first(),
    ).toBeVisible()
  })

  test("Create a new project successfully", async ({ page }) => {
    const name = randomProjectName()
    const client = randomClientName()

    await page.getByRole("button", { name: "New Project" }).first().click()
    await page.getByLabel("Project name").fill(name)
    await page.getByLabel("Client").fill(client)
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("Project created successfully")).toBeVisible()
    await expect(page.getByText(name)).toBeVisible()
  })

  test("Empty project name shows a validation error and keeps dialog open", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "New Project" }).first().click()
    await page.getByLabel("Project name").fill("")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("Project name is required")).toBeVisible()
    await expect(page.getByRole("dialog")).toBeVisible()
  })

  test.describe("With an existing project", () => {
    let projectName: string

    test.beforeEach(async ({ page }) => {
      projectName = randomProjectName()
      await page.getByRole("button", { name: "New Project" }).first().click()
      await page.getByLabel("Project name").fill(projectName)
      await page.getByRole("button", { name: "Save" }).click()
      await expect(page.getByText("Project created successfully")).toBeVisible()
      await expect(page.getByRole("dialog")).not.toBeVisible()
    })

    test("Switching to table view shows the expected headers, switching back returns to cards", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Table view" }).click()

      await expect(
        page.getByRole("columnheader", { name: "Project" }),
      ).toBeVisible()
      await expect(
        page.getByRole("columnheader", { name: "Client" }),
      ).toBeVisible()
      await expect(
        page.getByRole("columnheader", { name: "Default billable" }),
      ).toBeVisible()
      await expect(
        page.getByRole("columnheader", { name: "Status" }),
      ).toBeVisible()
      await expect(
        page.getByRole("columnheader", {
          name: "Hours logged (this month)",
        }),
      ).toBeVisible()

      await page.getByRole("button", { name: "Card view" }).click()
      await expect(page.getByTestId("project-card").first()).toBeVisible()
    })
  })
})
