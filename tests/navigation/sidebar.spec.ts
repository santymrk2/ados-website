import { test, expect } from "@playwright/test";
import { DashboardPage } from "../dashboard/dashboard-page";
import { mockDatabaseApi } from "../helpers/mock-database-api";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await mockDatabaseApi(page);
  });

  test(
    "Menu is a permanent sidebar on desktop and not on mobile",
    { tag: ["@critical", "@e2e", "@navigation", "@NAVIGATION-E2E-001"] },
    async ({ page }) => {
      // Desktop (default 1280px wide): the sidebar is there without opening anything
      await new DashboardPage(page).loginAsViewer();

      const sidebar = page.locator("aside").getByRole("navigation");
      await expect(sidebar).toBeVisible();
      await expect(sidebar.getByRole("button", { name: "Actividades" })).toBeVisible();

      // The content leaves room for it instead of sitting underneath
      const content = page.getByRole("heading", { name: "Dashboard" }).first();
      const contentBox = await content.boundingBox();
      expect(contentBox?.x ?? 0).toBeGreaterThanOrEqual(280);

      // Mobile: no sidebar, the menu opens from the header instead
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(sidebar).toBeHidden();
    },
  );
});
