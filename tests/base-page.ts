import type { Page } from "@playwright/test";

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async waitForNavigation(callback: () => Promise<void>): Promise<void> {
    await Promise.all([
      this.page.waitForURL((url) => !url.toString().includes("localhost") || true),
      callback(),
    ]);
  }

  async isVisible(selector: string): Promise<boolean> {
    return this.page.locator(selector).first().isVisible().catch(() => false);
  }
}