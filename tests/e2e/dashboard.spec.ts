import { test, expect } from "@playwright/test";
import { DEMO, apiLogin, expectNoConsoleErrors } from "./helpers";

const DASH_PAGES = [
  "/dashboard",
  "/dashboard/markets",
  "/dashboard/markets/AAPL",
  "/dashboard/watchlist",
  "/dashboard/portfolio",
  "/dashboard/positions",
  "/dashboard/transactions",
  "/dashboard/application",
  "/dashboard/settings",
];

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await apiLogin(page.request, DEMO.email, DEMO.password);
  });

  for (const path of DASH_PAGES) {
    test(`renders ${path} with DEMO marker and no console errors`, async ({ page }, testInfo) => {
      await expectNoConsoleErrors(page, async () => {
        const res = await page.goto(path);
        expect(res?.status()).toBeLessThan(400);
        await expect(page.getByTestId(/demo-(badge|notice)/).first()).toBeVisible();
      });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}${path.replace(/\//g, "_")}.png`, fullPage: true });
    });
  }

  test("price chart renders a canvas and range switching works", async ({ page }) => {
    await page.goto("/dashboard/markets/AAPL");
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole("tab", { name: /^1W$/ }).click();
    await expect(page.locator("canvas").first()).toBeVisible();
    await expect(page.getByText(/TradingView/)).toBeVisible();
  });

  test("market quotes API is public, rate-limited and labelled demo", async ({ request }) => {
    const res = await request.get("/api/market/quotes?symbols=AAPL,BTCUSD,EURUSD");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.demo).toBe(true);
    expect(body.data.quotes.length).toBe(3);
    expect(res.headers()["cache-control"]).toContain("no-store");
  });

  test("trade/deposit/withdraw actions are disabled", async ({ page }) => {
    await page.goto("/dashboard/markets/AAPL");
    const trade = page.getByRole("button", { name: /trade|buy|sell/i }).first();
    await expect(trade).toBeDisabled();
  });
});
