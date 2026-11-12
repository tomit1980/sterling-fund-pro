import { test, expect } from "@playwright/test";
import { expectNoConsoleErrors } from "./helpers";

const PAGES = [
  "/",
  "/accounts/individual",
  "/accounts/corporate",
  "/accounts/smsf",
  "/platform",
  "/legal/kyc-policy",
  "/legal/regulation",
  "/legal/risk-disclaimer",
  "/legal/privacy-policy",
  "/contact",
  "/support",
  "/login",
  "/register",
];

for (const path of PAGES) {
  test(`renders ${path} without console errors`, async ({ page }, testInfo) => {
    await expectNoConsoleErrors(page, async () => {
      const res = await page.goto(path);
      expect(res?.status(), `status for ${path}`).toBeLessThan(400);
      await expect(page.locator("main, [role=main]").first()).toBeVisible();
    });
    // No horizontal overflow at any viewport.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
    await page.screenshot({
      path: `docs/screenshots/${testInfo.project.name}${path === "/" ? "/home" : path.replace(/\//g, "_")}.png`,
      fullPage: true,
    });
  });
}

test("primary navigation links resolve", async ({ page }) => {
  await page.goto("/");
  const hrefs = await page.locator("header a[href^='/'], footer a[href^='/']").evaluateAll((els) =>
    Array.from(new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!))),
  );
  expect(hrefs.length).toBeGreaterThan(8);
  for (const href of hrefs) {
    const res = await page.request.get(href);
    expect(res.status(), `link ${href}`).toBeLessThan(400);
  }
});

test("platform preview and market widgets are labelled DEMO DATA", async ({ page }) => {
  await page.goto("/platform");
  await expect(page.getByTestId("demo-badge").first()).toBeVisible();
  await page.goto("/");
  await expect(page.getByTestId("demo-badge").first()).toBeVisible();
});

test("regulation page does not show unverified licence details", async ({ page }) => {
  await page.goto("/legal/regulation");
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/AFSL\s*\d{3,}/i);
  expect(text).toMatch(/verified|to be confirmed|once verified/i);
});
