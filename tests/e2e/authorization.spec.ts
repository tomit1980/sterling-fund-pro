import { test, expect } from "@playwright/test";
import { ADMIN, DEMO, apiLogin, latestMailLink, uniqueEmail } from "./helpers";

test.describe("authorization and isolation", () => {
  test("unauthenticated requests are rejected", async ({ request }) => {
    for (const path of ["/api/dashboard/summary", "/api/dashboard/watchlist", "/api/account/profile", "/api/admin/users"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(401);
    }
    // /api/auth/me is a probe: 200 with a null user when signed out.
    const me = await (await request.get("/api/auth/me")).json();
    expect(me.data.user).toBeNull();
    const page = await request.get("/dashboard", { maxRedirects: 0 });
    expect([302, 307, 308]).toContain(page.status());
  });

  test("a USER cannot reach admin pages or APIs", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await apiLogin(page.request, DEMO.email, DEMO.password);
    const api = await page.request.get("/api/admin/users");
    expect(api.status()).toBe(403);
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin$/);
    await ctx.close();
  });

  test("watchlists are isolated between accounts", async ({ browser, request }) => {
    // Create a second verified user.
    const email = uniqueEmail("iso");
    const password = "Isolation-pass-2026";
    const reg = await request.post("/api/auth/register", {
      data: { name: "Iso Tester", email, password, confirmPassword: password, acceptTerms: true },
    });
    expect(reg.ok()).toBeTruthy();
    const link = await latestMailLink(request, email, /verify-email\?token=/);
    const token = new URL(link, "http://localhost").searchParams.get("token")!;
    const verify = await request.post("/api/auth/verify-email", { data: { token } });
    expect(verify.ok()).toBeTruthy();

    const a = await browser.newContext();
    const b = await browser.newContext();
    const pa = await a.newPage();
    const pb = await b.newPage();
    await apiLogin(pa.request, DEMO.email, DEMO.password);
    await apiLogin(pb.request, email, password);

    const add = await pb.request.post("/api/dashboard/watchlist", { data: { symbol: "NVDA" } });
    expect(add.ok(), await add.text()).toBeTruthy();

    const listA = await (await pa.request.get("/api/dashboard/watchlist")).json();
    const listB = await (await pb.request.get("/api/dashboard/watchlist")).json();
    const symbolsA = (listA.data.items ?? listA.data.watchlist ?? listA.data).map((i: { symbol: string }) => i.symbol);
    const symbolsB = (listB.data.items ?? listB.data.watchlist ?? listB.data).map((i: { symbol: string }) => i.symbol);
    expect(symbolsB).toContain("NVDA");
    // Both lists are built only from the caller's rows.
    const summaryA = await (await pa.request.get("/api/dashboard/summary")).json();
    const summaryB = await (await pb.request.get("/api/dashboard/summary")).json();
    expect(summaryA.data.demo).toBe(true);
    expect(summaryB.data.demo).toBe(true);
    expect(JSON.stringify(summaryA)).not.toContain(email);
    expect(symbolsA).not.toEqual(symbolsB);
    await a.close();
    await b.close();
  });

  test("admin can review a submitted application", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await apiLogin(page.request, ADMIN.email, ADMIN.password);
    await page.goto("/admin/applications");
    await expect(page.locator("table").getByText(/submitted|under review/i).first()).toBeVisible();
    await ctx.close();
  });

  test("security headers are present", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("default-src 'self'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["referrer-policy"]).toBeTruthy();
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("cross-site mutation is rejected (CSRF)", async ({ request }) => {
    const res = await request.post("/api/support/contact", {
      headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site" },
      data: { name: "Evil Site", email: "evil@example.com", subject: "CSRF", message: "This should be rejected by the origin check." },
    });
    expect(res.status()).toBe(403);
  });
});
