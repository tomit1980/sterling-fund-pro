import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { PlatformPreview } from "@/components/marketing/platform-preview";
import { siteConfig } from "@/config/site";

describe("PlatformPreview", () => {
  it("carries the DEMO DATA marker on every card", () => {
    render(<PlatformPreview />);
    const preview = screen.getByTestId("platform-preview");
    const badges = within(preview).getAllByTestId("demo-badge");
    // chart card, watchlist card, portfolio stat
    expect(badges.length).toBeGreaterThanOrEqual(3);
    badges.forEach((b) => expect(b).toHaveTextContent(siteConfig.demo.label));
    expect(within(preview).getByRole("img", { name: /demo data/i })).toBeInTheDocument();
  });
});
