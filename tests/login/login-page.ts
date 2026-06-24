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
    this.passwordInput = page.getByRole("textbox", { name: "Contraseña" });
    this.submitButton = page.getByRole("button", { name: /Ingresar como/ });
    this.adminToggle = page.getByRole("switch", { name: /admin/i });
    this.lockIcon = page.getByRole("button", { name: "Mostrar selector de rol" });
    this.errorMessage = page.getByText("Contraseña incorrecta");
    this.showPasswordButton = page.getByRole("button", { name: "Mostrar contraseña" });
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

    const loginResponse = this.page.waitForResponse(
      (response) =>
        response.url().includes("/api/login") &&
        response.request().method() === "POST",
    );

    await this.submitButton.click();
    await loginResponse;
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.showPasswordButton.click();
  }

  async expectLoginError(): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
  }

  async expectAuthenticatedHome(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
      timeout: 15_000,
    });
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
