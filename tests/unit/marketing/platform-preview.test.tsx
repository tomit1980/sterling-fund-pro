import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { PlatformPreview } from "@/components/marketing/platform-preview";
import { siteConfig } from "@/config/site";

type Source = "demo" | "finnhub";

/** Answers /api/market/quotes for whatever symbols are requested; `sources` overrides the default source. */
function stubQuotes(defaultSource: Source, sources: Record<string, Source> = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) => {
      const symbols = new URL(input, "http://localhost").searchParams.get("symbols")!.split(",");
      const quotes = symbols.map((symbol) => ({
        symbol,
        name: `${symbol} name`,
        assetClass: symbol === "SPY" ? "ETF" : "EQUITY",
        price: 101,
        change: 1,
        changePct: 1,
        high: 102,
        low: 99,
        open: 100,
        prevClose: 100,
        updatedAt: new Date().toISOString(),
        source: sources[symbol] ?? defaultSource,
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

const watchlistCard = () => screen.getByTestId("preview-watchlist").parentElement!;
const quoteCard = () => screen.getByTestId("preview-quote-card");

describe("PlatformPreview", () => {
  it("with live prices, only the illustrative portfolio card carries DEMO DATA", async () => {
    stubQuotes("finnhub");
    render(<PlatformPreview />);
    const preview = screen.getByTestId("platform-preview");
    await waitFor(() => expect(within(watchlistCard()).getByText("Live quotes by Finnhub")).toBeInTheDocument());
    await waitFor(() => expect(within(quoteCard()).getByText("Live quote by Finnhub")).toBeInTheDocument());
    const badges = within(preview).getAllByTestId("demo-badge");
    expect(badges).toHaveLength(1);
    expect(badges[0]).toHaveTextContent(siteConfig.demo.label);
    expect(within(quoteCard()).getByRole("img", { name: /SPY day range/ })).toBeInTheDocument();
  });

  it("labels the quote card and watchlist DEMO DATA when their prices are simulated", async () => {
    stubQuotes("demo");
    render(<PlatformPreview />);
    await waitFor(() => expect(within(quoteCard()).getByTestId("demo-badge")).toBeInTheDocument());
    await waitFor(() => expect(within(watchlistCard()).getByTestId("demo-badge")).toBeInTheDocument());
    expect(within(quoteCard()).queryByText("Live quote by Finnhub")).not.toBeInTheDocument();
  });

  it("labels the watchlist DEMO DATA when even one price is simulated", async () => {
    stubQuotes("finnhub", { NVDA: "demo" });
    render(<PlatformPreview />);
    await waitFor(() => expect(within(watchlistCard()).getByTestId("demo-badge")).toBeInTheDocument());
    expect(within(quoteCard()).queryByTestId("demo-badge")).not.toBeInTheDocument();
  });

  it("shows no prices before the first response", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(<PlatformPreview />);
    expect(within(watchlistCard()).queryByText(/\d+\.\d{2}/)).not.toBeInTheDocument();
    expect(within(quoteCard()).queryByText(/\d+\.\d{2}/)).not.toBeInTheDocument();
    expect(within(quoteCard()).queryByTestId("demo-badge")).not.toBeInTheDocument();
  });
});
