"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { DemoBadge, Select, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import { ASSET_CLASS_LABELS, ASSET_CLASSES, type AssetClass, type Quote } from "@/lib/market/types";
import { valuePortfolio, type PositionInput, type ValuedPosition } from "@/lib/demo/valuation";
import { ChangeText, MoneyText, PriceText } from "./price-cells";
import { useQuotes } from "./use-quotes";

type SortKey = "symbol" | "quantity" | "avgCost" | "price" | "marketValue" | "unrealisedPnl" | "dayChangePct" | "weightPct";

export interface PositionsTableProps {
  positions: PositionInput[];
  /** Server-rendered quotes so the first paint has values; polling takes over afterwards. */
  initialQuotes?: Quote[];
  cash?: number;
  currency?: string;
  compact?: boolean;
  className?: string;
  pollMs?: number;
}

const COLUMNS: Array<{ key: SortKey; label: string; align?: "right"; compactHidden?: boolean }> = [
  { key: "symbol", label: "Instrument" },
  { key: "quantity", label: "Qty", align: "right" },
  { key: "avgCost", label: "Avg cost", align: "right", compactHidden: true },
  { key: "price", label: "Price", align: "right" },
  { key: "marketValue", label: "Value", align: "right" },
  { key: "unrealisedPnl", label: "Unrealised P&L (demo)", align: "right" },
  { key: "dayChangePct", label: "Today", align: "right", compactHidden: true },
  { key: "weightPct", label: "Weight", align: "right", compactHidden: true },
];

/** Sortable, filterable positions table with 15-s live demo quotes. */
export function PositionsTable({ positions, initialQuotes, cash = 0, currency = "USD", compact = false, className, pollMs }: PositionsTableProps) {
  const symbols = React.useMemo(() => [...new Set(positions.map((p) => p.symbol))], [positions]);
  const { list: quotes } = useQuotes(symbols, { initial: initialQuotes, intervalMs: pollMs });
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "marketValue", dir: "desc" });
  const [assetClass, setAssetClass] = React.useState<AssetClass | "ALL">("ALL");

  const valuation = React.useMemo(() => valuePortfolio(positions, quotes, cash), [positions, quotes, cash]);
  const rows = React.useMemo(() => {
    const filtered = assetClass === "ALL" ? valuation.positions : valuation.positions.filter((p) => p.assetClass === assetClass);
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
  }, [valuation, sort, assetClass]);

  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "symbol" ? "asc" : "desc" }));
  const columns = compact ? COLUMNS.filter((c) => !c.compactHidden) : COLUMNS;
  const present = new Set(valuation.positions.map((p) => p.assetClass));

  return (
    <div className={cn("space-y-3", className)} data-testid="positions-table">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Holdings are fictional even when prices are live, so the badge is unconditional. */}
          <DemoBadge />
          <span className="text-xs text-ink-500">
            {rows.length} of {valuation.positions.length} positions
          </span>
        </div>
        {!compact && (
          <label className="flex items-center gap-2 text-xs text-ink-500">
            Asset class
            <Select value={assetClass} onChange={(e) => setAssetClass(e.target.value as AssetClass | "ALL")} className="h-9 w-40 text-xs" aria-label="Filter by asset class">
              <option value="ALL">All</option>
              {ASSET_CLASSES.filter((c) => present.has(c)).map((c) => (
                <option key={c} value={c}>
                  {ASSET_CLASS_LABELS[c]}
                </option>
              ))}
            </Select>
          </label>
        )}
      </div>
      <Table>
        <THead>
          <tr>
            {columns.map((c) => (
              <TH key={c.key} align={c.align} aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                <button type="button" onClick={() => toggleSort(c.key)} className={cn("inline-flex items-center gap-1 uppercase hover:text-ink-900", c.align === "right" && "flex-row-reverse")}>
                  {c.label}
                  {sort.key === c.key ? (sort.dir === "asc" ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />) : <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden />}
                </button>
              </TH>
            ))}
          </tr>
        </THead>
        <TBody>
          {rows.map((p) => (
            <PositionRow key={p.symbol} p={p} currency={currency} compact={compact} />
          ))}
          {rows.length === 0 && (
            <TR>
              <TD colSpan={columns.length} className="py-8 text-center text-ink-500">
                No positions{assetClass !== "ALL" ? ` in ${ASSET_CLASS_LABELS[assetClass]}` : ""}.
              </TD>
            </TR>
          )}
        </TBody>
        {!compact && rows.length > 0 && (
          <tfoot className="border-t border-line bg-surface-2 text-xs">
            <tr>
              <TD className="font-medium text-ink-900">Total</TD>
              <TD />
              <TD />
              <TD />
              <TD align="right" numeric className="font-medium text-ink-900">
                {formatMoney(rows.reduce((s, r) => s + r.marketValue, 0), currency)}
              </TD>
              <TD align="right" numeric>
                <MoneyText value={rows.reduce((s, r) => s + r.unrealisedPnl, 0)} currency={currency} signed />
              </TD>
              <TD align="right" numeric>
                <MoneyText value={rows.reduce((s, r) => s + r.dayChange, 0)} currency={currency} signed />
              </TD>
              <TD align="right" numeric>
                {rows.reduce((s, r) => s + r.weightPct, 0).toFixed(1)}%
              </TD>
            </tr>
          </tfoot>
        )}
      </Table>
    </div>
  );
}

function PositionRow({ p, currency, compact }: { p: ValuedPosition; currency: string; compact: boolean }) {
  return (
    <TR>
      <TD>
        <Link href={`/dashboard/markets/${encodeURIComponent(p.symbol)}`} className="block">
          <span className="font-semibold text-ink-900">{p.symbol}</span>
          <span className="block max-w-[14rem] truncate text-xs text-ink-500">{p.name}</span>
        </Link>
        {!compact && p.openedAt && <span className="block text-[10px] text-ink-300">Opened {formatDate(p.openedAt)}</span>}
      </TD>
      <TD align="right" numeric>
        {p.quantity}
      </TD>
      {!compact && (
        <TD align="right" numeric>
          <PriceText value={p.avgCost} assetClass={p.assetClass} />
        </TD>
      )}
      <TD align="right" numeric>
        <PriceText value={p.price} assetClass={p.assetClass} className="text-ink-900" />
      </TD>
      <TD align="right" numeric className="text-ink-900">
        {formatMoney(p.marketValue, currency)}
      </TD>
      <TD align="right" numeric>
        <MoneyText value={p.unrealisedPnl} currency={currency} signed />
        <ChangeText value={p.unrealisedPnlPct} icon={false} className="ml-2 text-xs" />
      </TD>
      {!compact && (
        <TD align="right" numeric>
          <ChangeText value={p.dayChangePct} />
        </TD>
      )}
      {!compact && (
        <TD align="right" numeric>
          {p.weightPct.toFixed(1)}%
        </TD>
      )}
    </TR>
  );
}
