import { test, expect } from "@playwright/test";
import { DashboardPage, BottomNav } from "./dashboard-page";

test.describe("Dashboard", () => {
  let dashboardPage: DashboardPage;
  let bottomNav: BottomNav;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    bottomNav = new BottomNav(page);
    await dashboardPage.loginAsViewer();
  });

  test("Dashboard loads with header", async ({ page }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.header).toBeVisible();
  });

  test("Bottom navigation is visible", async ({ page }) => {
    await dashboardPage.goto();
    await dashboardPage.expectBottomNavVisible();
  });

  test("Stats cards are displayed", async ({ page }) => {
    await dashboardPage.goto();
    await dashboardPage.expectStatsCardsVisible();
  });

  test("Can open and close settings panel", async ({ page }) => {
    await dashboardPage.goto();
    await dashboardPage.openSettings();
    await dashboardPage.closeSettings();
  });

  test("Can navigate to Activities via bottom nav", async ({ page }) => {
    await dashboardPage.goto();
    await bottomNav.goToActivities();
    await expect(page).toHaveURL(/\/activities/);
  });

  test("Can navigate to Participants via bottom nav", async ({ page }) => {
    await dashboardPage.goto();
    await bottomNav.goToParticipants();
    await expect(page).toHaveURL(/\/participants/);
  });
});