import { test, expect, type Page } from "@playwright/test";
import { LoginPage } from "./login-page";

async function mockDatabaseApi(page: Page) {
  await page.route("**/api/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });

  await page.route("**/api/participants**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await page.route("**/api/activities**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await page.route("**/api/rankings**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

}

test.describe("Login", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    await mockDatabaseApi(page);
    loginPage = new LoginPage(page);
  });

  test(
    "Login page renders correctly",
    { tag: ["@critical", "@e2e", "@login", "@LOGIN-E2E-001"] },
    async ({ page }) => {
      await loginPage.goto();

      await expect(page.getByText("Acceso")).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
    },
  );

  test(
    "User can toggle admin/viewer mode by double-clicking lock icon",
    { tag: ["@high", "@e2e", "@login", "@LOGIN-E2E-002"] },
    async () => {
      await loginPage.goto();

      const adminToggle = loginPage.adminToggle;
      await expect(adminToggle).not.toBeVisible();

      await loginPage.lockIcon.dblclick();
      await expect(adminToggle).toBeVisible();

      await loginPage.lockIcon.dblclick();
      await expect(adminToggle).not.toBeVisible();
    },
  );

  test(
    "User can show/hide password",
    { tag: ["@medium", "@e2e", "@login", "@LOGIN-E2E-003"] },
    async ({ page }) => {
      await loginPage.goto();

      const passwordInput = page.locator("input[type='password']");
      await expect(passwordInput).toBeVisible();

      await loginPage.togglePasswordVisibility();

      const textInput = page.locator("input[type='text']");
      await expect(textInput).toBeVisible();
    },
  );

  test(
    "Login with invalid credentials shows error",
    { tag: ["@high", "@e2e", "@login", "@LOGIN-E2E-004"] },
    async () => {
      await loginPage.goto();
      await loginPage.login("wrongpassword", "viewer");

      await loginPage.expectLoginError();
    },
  );

  test(
    "Authenticated user reaches home dashboard",
    { tag: ["@critical", "@e2e", "@login", "@LOGIN-E2E-005"] },
    async () => {
      await loginPage.login("viewer123", "viewer");

      await loginPage.expectAuthenticatedHome();
    },
  );
});
