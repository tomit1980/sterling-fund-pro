import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { MarketTicker } from "@/components/dashboard/public";

type Source = "demo" | "finnhub";

function stubQuotes(sources: Record<string, Source>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      const quotes = Object.entries(sources).map(([symbol, source]) => ({
        symbol,
        name: symbol,
        assetClass: "EQUITY",
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

/** Symbols in the first (non-duplicated) half of the marquee track. */
const shownSymbols = () =>
  within(screen.getByTestId("market-ticker"))
    .getAllByRole("listitem", { hidden: true })
    .filter((li) => li.getAttribute("aria-hidden") !== "true")
    .map((li) => li.textContent?.match(/^[A-Z]+/)?.[0]);

describe("MarketTicker", () => {
  it("shows only live prices, without any demo label, when some prices are live", async () => {
    stubQuotes({ SPX: "demo", AAPL: "finnhub", MSFT: "finnhub", BTCUSD: "demo" });
    render(<MarketTicker symbols={["SPX", "AAPL", "MSFT", "BTCUSD"]} />);
    await waitFor(() => expect(shownSymbols()).toEqual(["AAPL", "MSFT"]));
    expect(within(screen.getByTestId("market-ticker")).queryByTestId("demo-badge")).not.toBeInTheDocument();
  });

  it("shows every simulated price under a DEMO DATA badge when nothing is live", async () => {
    stubQuotes({ SPX: "demo", AAPL: "demo", BTCUSD: "demo" });
    render(<MarketTicker symbols={["SPX", "AAPL", "BTCUSD"]} />);
    await waitFor(() => expect(shownSymbols()).toEqual(["SPX", "AAPL", "BTCUSD"]));
    expect(within(screen.getByTestId("market-ticker")).getByTestId("demo-badge")).toBeInTheDocument();
  });
});
