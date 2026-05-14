import { test, expect } from "@playwright/test";
import { ParticipantsPage } from "./participants-page";
import { TEST_USERS } from "../login/login-page";
import { LoginPage } from "../login/login-page";

test.describe("Participants", () => {
  test("Participants page renders", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.viewer.password, TEST_USERS.viewer.role);

    const participantsPage = new ParticipantsPage(page);
    await participantsPage.goto();

    await expect(participantsPage.header).toBeVisible();
  });

  test.skip("Can view participants list", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.viewer.password, TEST_USERS.viewer.role);

    const participantsPage = new ParticipantsPage(page);
    await participantsPage.goto();

    await expect(page.getByText(/\d+ jugadores/)).toBeVisible();
  });

  test.skip("Admin can see add participant link", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.admin.password, TEST_USERS.admin.role);

    const participantsPage = new ParticipantsPage(page);
    await participantsPage.goto();

    await expect(participantsPage.addButton).toBeVisible();
  });

  test.skip("Viewer cannot see add participant link", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.viewer.password, TEST_USERS.viewer.role);

    const participantsPage = new ParticipantsPage(page);
    await participantsPage.goto();

    await expect(participantsPage.addButton).not.toBeVisible();
  });

  test.skip("Clicking participant navigates to profile", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.viewer.password, TEST_USERS.viewer.role);

    const participantsPage = new ParticipantsPage(page);
    await participantsPage.goto();

    const count = await participantsPage.getParticipantCount();
    if (count > 0) {
      await participantsPage.clickFirstParticipant();
      await expect(page).toHaveURL(/\/participants\/\d+/);
    }
  });

  test.skip("Can navigate to create participant page", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.admin.password, TEST_USERS.admin.role);

    const participantsPage = new ParticipantsPage(page);
    await participantsPage.goto();

    await participantsPage.addButton.click();
    await expect(page).toHaveURL(/\/participants\/new/);
  });
});