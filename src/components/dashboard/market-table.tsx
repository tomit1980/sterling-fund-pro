"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronDown, ChevronUp, Search } from "lucide-react";
import { DemoBadge, Input, Select, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { Sparkline } from "@/components/charts/sparkline";
import { cn, formatCompact } from "@/lib/utils";
import { ASSET_CLASS_LABELS, ASSET_CLASSES, type AssetClass, type InstrumentInfo, type Quote } from "@/lib/market/types";
import { ChangeText, PriceText } from "./price-cells";
import { useQuotes } from "./use-quotes";

type SortKey = "symbol" | "name" | "price" | "changePct" | "volume";

export interface MarketTableProps {
  instruments: InstrumentInfo[];
  initialQuotes?: Quote[];
  className?: string;
  initialAssetClass?: AssetClass | "ALL";
}

/** Full market list: search + asset-class filter + sortable columns, quotes polled every 15 s. */
export function MarketTable({ instruments, initialQuotes, className, initialAssetClass = "ALL" }: MarketTableProps) {
  const [q, setQ] = React.useState("");
  const [assetClass, setAssetClass] = React.useState<AssetClass | "ALL">(initialAssetClass);
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "symbol", dir: "asc" });

  const visible = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return instruments.filter((i) => (assetClass === "ALL" || i.assetClass === assetClass) && (!needle || i.symbol.toLowerCase().includes(needle) || i.name.toLowerCase().includes(needle)));
  }, [instruments, q, assetClass]);

  // Poll quotes for the visible rows only (max 60 per request).
  const symbols = React.useMemo(() => visible.slice(0, 60).map((i) => i.symbol), [visible]);
  const { quotes, list, demo, loading } = useQuotes(symbols, { spark: true, initial: initialQuotes });
  const anyLive = list.some((x) => x.source !== "demo");
  const mixed = demo && anyLive;

  const rows = React.useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...visible].sort((a, b) => {
      if (sort.key === "symbol" || sort.key === "name") return a[sort.key].localeCompare(b[sort.key]) * dir;
      const qa = quotes.get(a.symbol);
      const qb = quotes.get(b.symbol);
      const av = sort.key === "volume" ? (qa?.volume ?? -1) : (qa?.[sort.key] ?? 0);
      const bv = sort.key === "volume" ? (qb?.volume ?? -1) : (qb?.[sort.key] ?? 0);
      return (av - bv) * dir;
    });
  }, [visible, sort, quotes]);

  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "symbol" || key === "name" ? "asc" : "desc" }));
  const header = (key: SortKey, label: string, align?: "right") => (
    <TH align={align} aria-sort={sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => toggleSort(key)} className={cn("inline-flex items-center gap-1 uppercase hover:text-ink-900", align === "right" && "flex-row-reverse")}>
        {label}
        {sort.key === key ? (sort.dir === "asc" ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />) : <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden />}
      </button>
    </TH>
  );

  return (
    <div className={cn("space-y-3", className)} data-testid="market-table">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search symbol or name" className="h-10 pl-9" aria-label="Search instruments" />
        </div>
        <Select value={assetClass} onChange={(e) => setAssetClass(e.target.value as AssetClass | "ALL")} className="h-10 w-44" aria-label="Filter by asset class">
          <option value="ALL">All asset classes</option>
          {ASSET_CLASSES.map((c) => (
            <option key={c} value={c}>
              {ASSET_CLASS_LABELS[c]}
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-2 text-xs text-ink-500">
          {demo && <DemoBadge />}
          {mixed && <span>on marked rows ·</span>}
          {anyLive && <span>Stock and ETF quotes by Finnhub ·</span>}
          <span>{visible.length} instruments</span>
        </div>
      </div>
      <Table>
        <THead>
          <tr>
            {header("symbol", "Symbol")}
            {header("name", "Name")}
            <TH>Class</TH>
            <TH>Trend</TH>
            {header("price", "Price", "right")}
            {header("changePct", "Change", "right")}
            {header("volume", "Volume", "right")}
          </tr>
        </THead>
        <TBody>
          {rows.map((i) => {
            const quote = quotes.get(i.symbol);
            return (
              <TR key={i.symbol}>
                <TD>
                  <Link href={`/dashboard/markets/${encodeURIComponent(i.symbol)}`} className="font-semibold text-ink-900 hover:underline">
                    {i.symbol}
                  </Link>
                </TD>
                <TD className="max-w-[16rem] truncate">{i.name}</TD>
                <TD className="text-xs text-ink-500">{ASSET_CLASS_LABELS[i.assetClass]}</TD>
                <TD>{quote?.spark ? <Sparkline values={quote.spark} /> : <span className="text-ink-300">{loading ? "…" : "—"}</span>}</TD>
                <TD align="right" numeric className="text-ink-900">
                  {quote ? <PriceText value={quote.price} assetClass={quote.assetClass} /> : "—"}
                  {mixed && quote?.source === "demo" && <DemoBadge className="ml-2" />}
                </TD>
                <TD align="right" numeric>
                  {quote ? <ChangeText value={quote.changePct} /> : "—"}
                </TD>
                <TD align="right" numeric className="text-xs">
                  {quote?.volume !== undefined ? formatCompact(quote.volume) : "—"}
                </TD>
              </TR>
            );
          })}
          {rows.length === 0 && (
            <TR>
              <TD colSpan={7} className="py-8 text-center text-ink-500">
                No instruments match your search.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
