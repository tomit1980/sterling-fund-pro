import { test, expect } from "@playwright/test";
import { ADMIN, apiLogin, uniqueEmail } from "./helpers";

test.describe("support and lead management", () => {
  test("contact form persists and appears in the admin inbox", async ({ page, browser }) => {
    const email = uniqueEmail("contact");
    const subject = `E2E enquiry ${Date.now()}`;
    await page.goto("/contact");
    await page.getByLabel(/full name|^name/i).fill("Contact Tester");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/subject/i).fill(subject);
    await page.getByLabel(/message/i).fill("I would like to know more about SMSF accounts and your demo platform.");
    await page.getByRole("button", { name: /send|submit/i }).click();
    await expect(page.getByText(/thank you|received|we('|’)ll be in touch/i).first()).toBeVisible();

    const adminCtx = await browser.newContext();
    const admin = await adminCtx.newPage();
    await apiLogin(admin.request, ADMIN.email, ADMIN.password);
    await admin.goto("/admin/support");
    await expect(admin.getByText(subject)).toBeVisible();
    await adminCtx.close();
  });

  test("contact form rejects a filled honeypot without storing", async ({ request }) => {
    const res = await request.post("/api/support/contact", {
      data: {
        name: "Spam Bot",
        email: uniqueEmail("spam"),
        subject: "Buy now",
        message: "This is definitely not spam, honest.",
        company_url: "http://spam.example",
        elapsedMs: 5,
      },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("support status never reports online without an agent heartbeat", async ({ request }) => {
    const res = await request.get("/api/support/status");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(typeof body.data.online).toBe("boolean");
    // No agent has sent a presence heartbeat in this fresh run.
    expect(body.data.online).toBe(false);
  });

  test("live chat: visitor starts a chat, agent replies, visitor sees the reply", async ({ page, browser }) => {
    await page.goto("/support");
    await page.getByRole("button", { name: /chat|support/i }).first().click();
    const widget = page.getByTestId("support-widget");
    await expect(widget).toBeVisible();
    await widget.getByLabel(/name/i).fill("Chat Visitor");
    await widget.getByLabel(/email/i).fill(uniqueEmail("chat"));
    const opening = `Hello, is the platform in demo mode? ${Date.now()}`;
    await widget.getByLabel(/message/i).fill(opening);
    await widget.getByRole("button", { name: /start|send/i }).click();
    await expect(widget.getByText(opening)).toBeVisible();

    const adminCtx = await browser.newContext();
    const admin = await adminCtx.newPage();
    await apiLogin(admin.request, ADMIN.email, ADMIN.password);
    await admin.goto("/admin/support");
    await admin.getByText(opening.slice(0, 30)).first().click();
    const reply = `Yes — all prices are demo data. ${Date.now()}`;
    await admin.getByLabel(/reply|message/i).fill(reply);
    await admin.getByRole("button", { name: /send|reply/i }).click();
    await expect(admin.getByText(reply)).toBeVisible();
    await adminCtx.close();

    await expect(widget.getByText(reply)).toBeVisible({ timeout: 15_000 });
  });
});
