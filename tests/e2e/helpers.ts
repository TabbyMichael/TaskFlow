import { expect, type Page } from "@playwright/test";

/** Log in using the demo credentials prefilled on the login form. */
export async function login(page: Page) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}
