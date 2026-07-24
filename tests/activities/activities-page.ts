import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base-page";
import { DashboardPage } from "../dashboard/dashboard-page";

export class ActivitiesPage extends BasePage {
  readonly header: Locator;
  readonly addActivityButton: Locator;
  readonly activityList: Locator;
  readonly newActivityModal: Locator;

  constructor(page: Page) {
    super(page);
    this.header = page.getByRole("heading", { name: "Actividades" }).first();
    this.addActivityButton = page.getByRole("button", { name: /agregar actividad/i });
    this.activityList = page.locator(".cursor-pointer");
    this.newActivityModal = page.getByRole("dialog");
  }

  async goto(): Promise<void> {
    await super.goto("/activities");
  }

  async loginAsAdmin(): Promise<void> {
    const dashboardPage = new DashboardPage(this.page);
    const { TEST_USERS } = await import("../login/login-page");
    const loginPage = await dashboardPage["loginPage"]?.constructor();
    if (!loginPage) {
      const { LoginPage } = await import("../login/login-page");
      const lp = new LoginPage(this.page);
      await lp.login(TEST_USERS.admin.password, TEST_USERS.admin.role);
    }
  }

  async clickAddActivity(): Promise<void> {
    await this.addActivityButton.click();
    await expect(this.newActivityModal).toBeVisible();
  }

  async getActivityCount(): Promise<number> {
    return this.activityList.count();
  }

  async clickFirstActivity(): Promise<void> {
    await this.activityList.first().click();
  }
}