import { test, expect } from "@playwright/test";
import { latestMailLink, uniqueEmail, uiLogin, DEMO } from "./helpers";

test.describe("account lifecycle", () => {
  test("register → verify email → login → dashboard → logout", async ({ page, request }) => {
    const email = uniqueEmail("reg");
    const password = "Strong-pass-2026-x";

    await page.goto("/register?type=INDIVIDUAL");
    await page.getByLabel(/full name|^name/i).fill("E2E Tester");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password/i).fill(password);
    await page.getByLabel(/confirm password/i).fill(password);
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: /create account|register|open account/i }).click();
    await expect(page.getByText(/check your email|verification/i).first()).toBeVisible();

    // Login before verification must be refused.
    const early = await request.post("/api/auth/login", { data: { email, password } });
    expect(early.status()).toBe(403);

    const link = await latestMailLink(request, email, /verify-email\?token=/);
    await page.goto(link);
    await expect(page.getByText(/verified|confirmed/i).first()).toBeVisible();

    await uiLogin(page, email, password);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("demo-notice").first()).toBeVisible();

    const me = await page.request.get("/api/auth/me");
    expect(me.ok()).toBeTruthy();
    const body = await me.json();
    expect(body.data.user.email).toBe(email);
    expect(JSON.stringify(body)).not.toMatch(/passwordHash|mfaSecret/);

    await page.request.post("/api/auth/logout");
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("password reset via emailed token", async ({ page, request }) => {
    const email = uniqueEmail("reset");
    const password = "Strong-pass-2026-y";
    const reg = await request.post("/api/auth/register", {
      data: { name: "Reset Tester", email, password, confirmPassword: password, acceptTerms: true },
    });
    expect(reg.ok()).toBeTruthy();
    const verify = await latestMailLink(request, email, /verify-email\?token=/);
    await page.goto(verify);

    const forgot = await request.post("/api/auth/forgot-password", { data: { email } });
    expect(forgot.ok()).toBeTruthy();
    const reset = await latestMailLink(request, email, /reset-password\?token=/);
    await page.goto(reset);
    const newPassword = "Even-stronger-2026-z";
    await page.getByLabel(/^new password|^password/i).first().fill(newPassword);
    await page.getByLabel(/confirm/i).fill(newPassword);
    await page.getByRole("button", { name: /reset|update|change/i }).click();
    await expect(page.getByText(/password (has been )?(reset|updated)|sign in/i).first()).toBeVisible();

    const old = await request.post("/api/auth/login", { data: { email, password } });
    expect(old.status()).toBe(401);
    const fresh = await request.post("/api/auth/login", { data: { email, password: newPassword } });
    expect(fresh.ok()).toBeTruthy();
  });

  test("seeded demo user can log in and see the demo portfolio", async ({ page }) => {
    await uiLogin(page, DEMO.email, DEMO.password);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("demo-badge").first()).toBeVisible();
    await page.goto("/dashboard/positions");
    await expect(page.getByTestId("demo-badge").first()).toBeVisible();
    await page.goto("/dashboard/transactions");
    await expect(page.getByTestId("demo-badge").first()).toBeVisible();
  });

  test("register form validates and blocks weak passwords", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel(/full name|^name/i).fill("A");
    await page.getByLabel(/email/i).fill("not-an-email");
    await page.getByLabel(/^password/i).fill("weak");
    await page.getByLabel(/confirm password/i).fill("other");
    await page.getByRole("button", { name: /create account|register|open account/i }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });
});
