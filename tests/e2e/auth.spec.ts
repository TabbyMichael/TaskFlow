import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("authentication", () => {
  test("redirects unauthenticated users to the login page", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("rejects an invalid email", async ({ page }) => {
    await page.goto("/login");
    const email = page.getByLabel("Email");
    await email.fill("not-an-email");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("logs in with the demo credentials and reaches the dashboard", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("keeps the session after a reload", async ({ page }) => {
    await login(page);
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("signs out from the account menu", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});
