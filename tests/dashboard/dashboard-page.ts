import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base-page";
import { LoginPage, TEST_USERS } from "../login/login-page";

export class DashboardPage extends BasePage {
  readonly header: Locator;
  readonly settingsButton: Locator;
  readonly settingsPanel: Locator;
  readonly bottomNav: Locator;
  readonly statsCards: Locator;
  readonly activitiesSection: Locator;

  constructor(page: Page) {
    super(page);
    this.header = page.getByRole("heading", { name: "Dashboard" });
    this.settingsButton = page.locator("button").filter({ has: page.locator("svg") }).first();
    this.settingsPanel = page.getByRole("dialog");
    this.bottomNav = page.locator("nav").last();
    this.statsCards = page.locator(".rounded-2xl, .rounded-xl").filter({ has: page.getByText(/actividades|jugadores|promedio/i) });
    this.activitiesSection = page.getByText(/últimas actividades/i);
  }

  async goto(): Promise<void> {
    await super.goto("/");
  }

  async loginAsViewer(): Promise<void> {
    const loginPage = new LoginPage(this.page);
    await loginPage.login(TEST_USERS.viewer.password, TEST_USERS.viewer.role);
    await loginPage.expectAuthenticatedHome();
  }

  async loginAsAdmin(): Promise<void> {
    const loginPage = new LoginPage(this.page);
    await loginPage.login(TEST_USERS.admin.password, TEST_USERS.admin.role);
    await loginPage.expectAuthenticatedHome();
  }

  async openSettings(): Promise<void> {
    await this.settingsButton.click();
    await expect(this.settingsPanel).toBeVisible();
  }

  async closeSettings(): Promise<void> {
    await this.settingsPanel.locator("button").first().click();
    await expect(this.settingsPanel).not.toBeVisible();
  }

  async expectBottomNavVisible(): Promise<void> {
    await expect(this.bottomNav).toBeVisible();
  }

  async expectStatsCardsVisible(): Promise<void> {
    await expect(this.statsCards.first()).toBeVisible();
  }
}

export class BottomNav {
  readonly dashboardLink: Locator;
  readonly activitiesLink: Locator;
  readonly participantsLink: Locator;

  constructor(private page: Page) {
    this.dashboardLink = page.getByRole("link", { name: /dashboard/i });
    this.activitiesLink = page.getByRole("link", { name: /actividades/i });
    this.participantsLink = page.getByRole("link", { name: /jugadores/i });
  }

  async goToActivities(): Promise<void> {
    await this.activitiesLink.click();
  }

  async goToParticipants(): Promise<void> {
    await this.participantsLink.click();
  }

  async goToDashboard(): Promise<void> {
    await this.dashboardLink.click();
  }
}
