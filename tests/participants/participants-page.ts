import { Page, Locator } from "@playwright/test";
import { BasePage } from "../base-page";
import { DashboardPage } from "../dashboard/dashboard-page";

export class ParticipantsPage extends BasePage {
  readonly header: Locator;
  readonly addButton: Locator;
  readonly participantList: Locator;

  constructor(page: Page) {
    super(page);
    this.header = page.getByRole("heading", { name: "Jugadores" }).first();
    this.addButton = page.getByRole("link", { name: /nuevo jugador/i });
    this.participantList = page.locator("a[href*='/participants/']").filter({ hasNot: page.locator("text=nuevo") });
  }

  async goto(): Promise<void> {
    await super.goto("/participants");
  }

  async loginAsAdmin(): Promise<void> {
    const dashboardPage = new DashboardPage(this.page);
    await dashboardPage.loginAsAdmin();
  }

  async getParticipantCount(): Promise<number> {
    return this.participantList.count();
  }

  async clickFirstParticipant(): Promise<void> {
    await this.participantList.first().click();
  }
}
