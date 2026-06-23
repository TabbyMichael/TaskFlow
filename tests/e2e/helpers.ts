import { expect, type Page } from "@playwright/test";

export const DEMO_EMAIL = "alice@taskflow.com";
export const DEMO_PASSWORD = "password";

/** Log in to the seeded demo tenant via the real backend. */
export async function login(page: Page) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.getByLabel("Email").fill(DEMO_EMAIL);
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}
