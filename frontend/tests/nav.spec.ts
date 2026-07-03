import { expect, test } from "@playwright/test"
import { createUser } from "./utils/privateApi"
import { randomEmail, randomPassword } from "./utils/random"
import { logInUser } from "./utils/user"

test("Sidebar shows a Time Tracking group with Projects, Log Time, Hours Dashboard links", async ({
  page,
}) => {
  await page.goto("/")

  await expect(page.getByText("Time Tracking")).toBeVisible()
  await expect(page.getByRole("link", { name: "Projects" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Log Time" })).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Hours Dashboard" }),
  ).toBeVisible()
})

test("Clicking each Time Tracking link navigates and highlights the active link", async ({
  page,
}) => {
  await page.goto("/")

  await page.getByRole("link", { name: "Projects" }).click()
  await expect(page).toHaveURL("/projects")
  await expect(page.getByRole("link", { name: "Projects" })).toHaveAttribute(
    "data-active",
    "true",
  )

  await page.getByRole("link", { name: "Log Time" }).click()
  await expect(page).toHaveURL("/log-time")
  await expect(page.getByRole("link", { name: "Log Time" })).toHaveAttribute(
    "data-active",
    "true",
  )

  await page.getByRole("link", { name: "Hours Dashboard" }).click()
  await expect(page).toHaveURL("/hours-dashboard")
  await expect(
    page.getByRole("link", { name: "Hours Dashboard" }),
  ).toHaveAttribute("data-active", "true")
})

test.describe("Time Tracking nav visibility across roles", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("Regular (non-superuser) users see the Time Tracking group", async ({
    page,
  }) => {
    const email = randomEmail()
    const password = randomPassword()
    await createUser({ email, password })
    await logInUser(page, email, password)

    await expect(page.getByText("Time Tracking")).toBeVisible()
    await expect(page.getByRole("link", { name: "Projects" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Log Time" })).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Hours Dashboard" }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Admin" })).not.toBeVisible()
  })
})
