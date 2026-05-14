import { test, expect } from "@playwright/test";
import { ActivitiesPage } from "./activities-page";
import { TEST_USERS } from "../login/login-page";
import { LoginPage } from "../login/login-page";

test.describe("Activities", () => {
  test("Activities page renders", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.viewer.password, TEST_USERS.viewer.role);

    const activitiesPage = new ActivitiesPage(page);
    await activitiesPage.goto();

    await expect(activitiesPage.header).toBeVisible();
  });

  test("Can view activities list", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.viewer.password, TEST_USERS.viewer.role);

    const activitiesPage = new ActivitiesPage(page);
    await activitiesPage.goto();

    await expect(page.getByText(/registradas/)).toBeVisible();
  });

  test("Admin can see add activity button", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.admin.password, TEST_USERS.admin.role);

    const activitiesPage = new ActivitiesPage(page);
    await activitiesPage.goto();

    await expect(activitiesPage.addActivityButton).toBeVisible();
  });

  test("Viewer cannot see add activity button", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.viewer.password, TEST_USERS.viewer.role);

    const activitiesPage = new ActivitiesPage(page);
    await activitiesPage.goto();

    await expect(activitiesPage.addActivityButton).not.toBeVisible();
  });

  test("Clicking activity navigates to detail view", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.viewer.password, TEST_USERS.viewer.role);

    const activitiesPage = new ActivitiesPage(page);
    await activitiesPage.goto();

    const count = await activitiesPage.getActivityCount();
    if (count > 0) {
      await activitiesPage.clickFirstActivity();
      await expect(page).toHaveURL(/\/activities\/\d+/);
    }
  });
});