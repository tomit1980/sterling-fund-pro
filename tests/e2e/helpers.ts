import { expect, type Page, type APIRequestContext } from "@playwright/test";

export const ADMIN = { email: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com", password: process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-Admin-2026!" };
export const DEMO = { email: process.env.SEED_DEMO_USER_EMAIL ?? "demo@example.com", password: process.env.SEED_DEMO_USER_PASSWORD ?? "ChangeMe-Demo-2026!" };

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

/** Log in through the API (fast path) and store the cookie on the page context. */
export async function apiLogin(request: APIRequestContext, email: string, password: string) {
  const res = await request.post("/api/auth/login", { data: { email, password } });
  expect(res.ok(), `login ${email} → ${res.status()} ${await res.text()}`).toBeTruthy();
  return res;
}

/** Log in through the UI. */
export async function uiLogin(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^password/i).fill(password);
  await page.getByRole("button", { name: /log in|sign in/i }).click();
  await page.waitForURL(/\/dashboard|\/login\/mfa/);
}

/** Pull the newest link for an address from the dev mailbox. */
export async function latestMailLink(request: APIRequestContext, to: string, matcher: RegExp): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const res = await request.get("/dev/mailbox");
    const html = await res.text();
    const links = Array.from(html.matchAll(/href="([^"]+)"/g)).map((m) => m[1].replace(/&amp;/g, "&"));
    const idx = html.indexOf(to);
    if (idx >= 0) {
      const candidates = links.filter((l) => matcher.test(l));
      // Email links carry NEXT_PUBLIC_SITE_URL; keep only path + query so page.goto resolves against baseURL.
      if (candidates.length) {
        const u = new URL(candidates[0], "http://localhost");
        return `${u.pathname}${u.search}`;
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No mail link for ${to} matching ${matcher}`);
}

export async function expectNoConsoleErrors(page: Page, run: () => Promise<void>, allow: RegExp[] = []) {
  const errors: string[] = [];
  const onConsole = (msg: { type(): string; text(): string }) => {
    if (msg.type() === "error" && !allow.some((re) => re.test(msg.text()))) errors.push(msg.text());
  };
  page.on("console", onConsole);
  const onPageError = (err: Error) => errors.push(err.message);
  page.on("pageerror", onPageError);
  await run();
  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  expect(errors, `console errors:\n${errors.join("\n")}`).toEqual([]);
}
