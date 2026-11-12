import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { PlatformPreview } from "@/components/marketing/platform-preview";
import { siteConfig } from "@/config/site";

type Source = "demo" | "finnhub";

function stubQuotes(sources: Record<string, Source>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      const quotes = Object.entries(sources).map(([symbol, source]) => ({
        symbol,
        name: `${symbol} name`,
        assetClass: symbol === "SPY" ? "ETF" : "EQUITY",
        price: 100,
        change: 1,
        changePct: 1,
        high: 101,
        low: 99,
        open: 99.5,
        prevClose: 99,
        updatedAt: new Date().toISOString(),
        source,
      }));
      const demo = quotes.some((q) => q.source === "demo");
      return new Response(JSON.stringify({ ok: true, data: { quotes, source: "finnhub", asOf: new Date().toISOString(), demo } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const ALL = ["AAPL", "MSFT", "NVDA", "SPY"];
const watchlistCard = () => screen.getByTestId("preview-watchlist").parentElement!;

describe("PlatformPreview", () => {
  it("always labels the illustrative chart and portfolio cards", async () => {
    stubQuotes(Object.fromEntries(ALL.map((s) => [s, "finnhub" as Source])));
    render(<PlatformPreview />);
    const preview = screen.getByTestId("platform-preview");
    await waitFor(() => expect(within(watchlistCard()).getByText("Live quotes by Finnhub")).toBeInTheDocument());
    const badges = within(preview).getAllByTestId("demo-badge");
    // chart card + portfolio stat; the all-live watchlist carries none
    expect(badges).toHaveLength(2);
    badges.forEach((b) => expect(b).toHaveTextContent(siteConfig.demo.label));
    expect(within(preview).getByRole("img", { name: /demo data/i })).toBeInTheDocument();
  });

  it("labels the watchlist DEMO DATA when its prices are simulated", async () => {
    stubQuotes(Object.fromEntries(ALL.map((s) => [s, "demo" as Source])));
    render(<PlatformPreview />);
    await waitFor(() => expect(within(watchlistCard()).getByTestId("demo-badge")).toBeInTheDocument());
    expect(within(watchlistCard()).queryByText("Live quotes by Finnhub")).not.toBeInTheDocument();
  });

  it("labels the watchlist DEMO DATA when even one price is simulated", async () => {
    stubQuotes({ AAPL: "finnhub", MSFT: "finnhub", NVDA: "demo", SPY: "finnhub" });
    render(<PlatformPreview />);
    await waitFor(() => expect(within(watchlistCard()).getByTestId("demo-badge")).toBeInTheDocument());
  });

  it("shows no prices before the first response", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(<PlatformPreview />);
    expect(within(watchlistCard()).queryByText(/\d+\.\d{2}/)).not.toBeInTheDocument();
    expect(within(watchlistCard()).queryByTestId("demo-badge")).not.toBeInTheDocument();
  });
});
