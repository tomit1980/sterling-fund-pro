import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteHeader } from "@/components/marketing/header";
import { ACCOUNT_LINKS, LEGAL_LINKS } from "@/components/marketing/nav-config";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

afterEach(cleanup);

describe("SiteHeader", () => {
  it("renders the primary navigation with all account and legal links", async () => {
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Primary" });

    expect(within(nav).getByRole("link", { name: "Platform" })).toHaveAttribute("href", "/platform");
    expect(within(nav).getByRole("link", { name: "Support" })).toHaveAttribute("href", "/support");

    // Dropdown links are in the DOM (hidden) and expose the correct hrefs.
    for (const l of [...ACCOUNT_LINKS, ...LEGAL_LINKS]) {
      expect(within(nav).getByRole("menuitem", { name: new RegExp(l.label), hidden: true })).toHaveAttribute("href", l.href);
    }

    // Auth CTAs
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Open account" })).toHaveAttribute("href", "/register");
  });

  it("opens the Accounts dropdown on click and exposes aria state", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    const trigger = screen.getByRole("button", { name: "Accounts" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("menu", { name: "Accounts" });
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(ACCOUNT_LINKS.length);
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the mobile menu sheet", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const sheet = screen.getByRole("dialog", { name: "Menu" });
    expect(within(sheet).getByRole("link", { name: "Individual" })).toHaveAttribute("href", "/accounts/individual");
    expect(within(sheet).getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/legal/privacy-policy");
  });
});
