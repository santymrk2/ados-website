import { test, expect } from "@playwright/test";
import { DashboardPage } from "../dashboard/dashboard-page";
import { mockDatabaseApi } from "../helpers/mock-database-api";

test.describe("Calendar", () => {
  test.beforeEach(async ({ page }) => {
    await mockDatabaseApi(page);

    // One birthday in the current month, so it shows up in the default month tab
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    await page.route("**/api/participants**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              nombre: "Ana",
              apellido: "Prueba",
              sexo: "F",
              telefono: "1155550000",
              fechaNacimiento: `2010-${month}-15`,
            },
          ],
        }),
      });
    });
  });

  test(
    "Birthday detail modal has an opaque background",
    { tag: ["@critical", "@e2e", "@calendar", "@CALENDAR-E2E-001"] },
    async ({ page }) => {
      await new DashboardPage(page).loginAsViewer();
      await page.goto("/calendar");

      await page.getByText("Ana Prueba").first().click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      // A missing theme color made tailwind-merge drop bg-white and leave the modal see-through
      const background = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(background).not.toBe("rgba(0, 0, 0, 0)");
      expect(background).not.toBe("transparent");
    },
  );
});
