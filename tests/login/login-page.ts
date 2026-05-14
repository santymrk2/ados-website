import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base-page";

export class LoginPage extends BasePage {
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly adminToggle: Locator;
  readonly lockIcon: Locator;
  readonly errorMessage: Locator;
  readonly showPasswordButton: Locator;

  constructor(page: Page) {
    super(page);
    this.passwordInput = page.locator('input[type="password"], input[type="text"]').first();
    this.submitButton = page.getByRole("button", { name: /Ingresar como/ });
    this.adminToggle = page.locator("#admin-mode");
    this.lockIcon = page.locator(".min-h-screen .bg-primary\\/10");
    this.errorMessage = page.getByText(/contraseña/i);
    this.showPasswordButton = page.locator('button[type="button"]').filter({ has: page.locator("svg") }).first();
  }

  async goto(): Promise<void> {
    await super.goto("/");
  }

  async login(password: string, role: "admin" | "viewer" = "viewer"): Promise<void> {
    await this.goto();

    if (role === "admin") {
      await this.lockIcon.dblclick();
      await this.adminToggle.click();
    }

    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.showPasswordButton.click();
  }

  async expectLoginError(): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
  }

  async expectRedirectToDashboard(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/api\/auth/);
    await this.page.waitForLoadState("networkidle");
  }
}

export interface LoginCredentials {
  password: string;
  role: "admin" | "viewer";
}

export const TEST_USERS = {
  admin: { password: "admin123", role: "admin" as const },
  viewer: { password: "viewer123", role: "viewer" as const },
  invalid: { password: "wrongpassword", role: "viewer" as const },
};