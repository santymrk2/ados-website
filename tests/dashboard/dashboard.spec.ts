import { test, expect } from "@playwright/test";
import { DashboardPage, BottomNav } from "./dashboard-page";
import { mockDatabaseApi } from "../helpers/mock-database-api";

test.describe("Dashboard", () => {
  let dashboardPage: DashboardPage;
  let bottomNav: BottomNav;

  test.beforeEach(async ({ page }) => {
    await mockDatabaseApi(page);
    dashboardPage = new DashboardPage(page);
    bottomNav = new BottomNav(page);
  });

  test("Dashboard loads with header", async ({ page }) => {
    await dashboardPage.loginAsViewer();
    await dashboardPage.goto();
    await expect(dashboardPage.header).toBeVisible();
  });

  test.skip("Bottom navigation is visible", async ({ page }) => {
    await dashboardPage.loginAsViewer();
    await dashboardPage.goto();
    await dashboardPage.expectBottomNavVisible();
  });

  test.skip("Stats cards are displayed", async ({ page }) => {
    await dashboardPage.loginAsViewer();
    await dashboardPage.goto();
    await dashboardPage.expectStatsCardsVisible();
  });

  test.skip("Can open and close settings panel", async ({ page }) => {
    await dashboardPage.loginAsViewer();
    await dashboardPage.goto();
    await dashboardPage.openSettings();
    await dashboardPage.closeSettings();
  });

  test.skip("Can navigate to Activities via bottom nav", async ({ page }) => {
    await dashboardPage.loginAsViewer();
    await dashboardPage.goto();
    await bottomNav.goToActivities();
    await expect(page).toHaveURL(/\/activities/);
  });

  test.skip("Can navigate to Participants via bottom nav", async ({ page }) => {
    await dashboardPage.loginAsViewer();
    await dashboardPage.goto();
    await bottomNav.goToParticipants();
    await expect(page).toHaveURL(/\/participants/);
  });
});
