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
      await expect(page).toHaveURL(/\/activities\/\d+\/asistencia/);
    }
  });

  test("Admin can autosave general edits without save button", async ({ page }) => {
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
    await expect(page).toHaveURL(/\/activities\/\d+\/asistencia/);

    const editUrl = page.url().replace(/\/activities\/(\d+)(?:\/.*)?$/, "/activities/$1/general");
    await page.goto(editUrl);

    await expect(page.getByRole("button", { name: "Guardar cambios" })).not.toBeVisible();
    await page.getByRole("button", { name: "Editar" }).click();

    const titleInput = page.getByPlaceholder("Nombre de la actividad");
    const nextTitle = `Actividad QA ${Date.now()}`;

    await titleInput.fill(nextTitle);
    await page.getByRole("button", { name: "Listo" }).click();
    await expect(page.getByText(nextTitle)).toBeVisible();
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
    await expect(page).toHaveURL(/\/activities\/\d+\/asistencia/);

    const editUrl = page.url().replace(/\/activities\/(\d+)(?:\/.*)?$/, "/activities/$1/general");
    await page.goto(editUrl);

    const lockSwitch = page.getByRole("switch").first();
    if (!(await lockSwitch.isChecked())) {
      await lockSwitch.check();
    }

    await expect(page.getByText(/Bloqueada/)).toBeVisible();
    await expect(page.getByText(/Solo lectura para todos/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Editar" })).not.toBeVisible();
  });
});
