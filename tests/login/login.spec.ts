import { test, expect } from "@playwright/test";
import { LoginPage, TEST_USERS } from "./login-page";

test.describe("Login", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test("Login page renders correctly", async ({ page }) => {
    await loginPage.goto();

    await expect(page.getByText("Acceso")).toBeVisible();
    await expect(page.locator("input[type='password'], input[type='text']")).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test("User can toggle admin/viewer mode by double-clicking lock icon", async ({ page }) => {
    await loginPage.goto();

    const adminToggle = loginPage.adminToggle;
    await expect(adminToggle).not.toBeVisible();

    await loginPage.lockIcon.dblclick();
    await expect(adminToggle).toBeVisible();

    await loginPage.lockIcon.dblclick();
    await expect(adminToggle).not.toBeVisible();
  });

  test("User can show/hide password", async ({ page }) => {
    await loginPage.goto();

    const passwordInput = page.locator("input[type='password']");
    await expect(passwordInput).toBeVisible();

    await loginPage.togglePasswordVisibility();

    const textInput = page.locator("input[type='text']");
    await expect(textInput).toBeVisible();
  });

  test("Login with invalid credentials shows error", async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.invalid.password, TEST_USERS.invalid.role);

    await loginPage.expectLoginError();
  });

  test("Authenticated user is redirected to dashboard", async ({ page }) => {
    await loginPage.login(TEST_USERS.viewer.password, TEST_USERS.viewer.role);

    await loginPage.expectRedirectToDashboard();
  });
});