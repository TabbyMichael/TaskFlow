import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const NAV: { link: string; path: RegExp; heading: string }[] = [
  { link: "Projects", path: /\/projects/, heading: "Projects" },
  { link: "Tasks", path: /\/tasks/, heading: "Tasks" },
  { link: "Kanban Board", path: /\/kanban/, heading: "Kanban Board" },
  { link: "Sprints", path: /\/sprints/, heading: "Sprints" },
  { link: "Team", path: /\/team/, heading: "Team" },
  { link: "Reports", path: /\/reports/, heading: "Reports" },
  { link: "Notifications", path: /\/notifications/, heading: "Notifications" },
  { link: "Settings", path: /\/settings/, heading: "Settings" },
  { link: "Admin", path: /\/admin/, heading: "Admin" },
];

test.describe("primary navigation", () => {
  test("navigates to every section from the sidebar", async ({ page }) => {
    await login(page);
    for (const item of NAV) {
      await page.getByRole("link", { name: item.link, exact: true }).first().click();
      await expect(page).toHaveURL(item.path);
      await expect(
        page.getByRole("heading", { name: item.heading, exact: true }).first(),
      ).toBeVisible();
    }
  });

  test("toggles the color theme", async ({ page }) => {
    await login(page);
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);
    await page.getByRole("button", { name: "Toggle theme" }).click();
    await expect(html).toHaveClass(/dark/);
  });

  test("exposes a global search input", async ({ page }) => {
    await login(page);
    const search = page.getByLabel("Global search");
    await expect(search).toBeVisible();
    await search.fill("redesign");
    await expect(search).toHaveValue("redesign");
  });
});
