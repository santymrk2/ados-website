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

  test("Admin sees save status and no success toast for simple edits", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.admin.password, TEST_USERS.admin.role);

    const activitiesPage = new ActivitiesPage(page);
    await activitiesPage.goto();

    const count = await activitiesPage.getActivityCount();
    if (count === 0) {
      test.skip(true, "No activities seeded");
      return;
    }

    await activitiesPage.clickFirstActivity();
    await expect(page).toHaveURL(/\/activities\/\d+/);

    const editUrl = page.url().replace(/\/activities\/(\d+)(?:\/.*)?$/, "/activities/$1/edit");
    await page.goto(editUrl);

    const titleInput = page.getByPlaceholder("Ej: Actividad Mayo");
    const nextTitle = `Actividad QA ${Date.now()}`;

    await titleInput.fill(nextTitle);
    await expect(page.getByRole("button", { name: "Guardando..." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardado" })).toBeVisible();
    await expect(titleInput).toHaveValue(nextTitle);
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
  });

  test("Lock state shows explanation and blocks editing", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.admin.password, TEST_USERS.admin.role);

    const activitiesPage = new ActivitiesPage(page);
    await activitiesPage.goto();

    const count = await activitiesPage.getActivityCount();
    if (count === 0) {
      test.skip(true, "No activities seeded");
      return;
    }

    await activitiesPage.clickFirstActivity();
    await expect(page).toHaveURL(/\/activities\/\d+/);

    const editUrl = page.url().replace(/\/activities\/(\d+)(?:\/.*)?$/, "/activities/$1/edit");
    await page.goto(editUrl);

    const lockSwitch = page.getByRole("switch").first();
    if (!(await lockSwitch.isChecked())) {
      await lockSwitch.check();
    }

    await expect(page.getByText(/La actividad está bloqueada/)).toBeVisible();
    await expect(page.getByPlaceholder("Ej: Actividad Mayo")).toBeDisabled();
  });
});
