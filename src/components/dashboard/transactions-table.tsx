"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, Button, DemoBadge, Input, Select, Table, TBody, TD, TH, THead, TR, type BadgeTone } from "@/components/ui";
import { cn, formatDateTime, formatMoney } from "@/lib/utils";
import type { DemoPortfolioData } from "@/lib/demo/valuation";
import { MoneyText } from "./price-cells";

export type TransactionRow = DemoPortfolioData["transactions"][number];
type TxType = TransactionRow["type"];

const TYPE_LABEL: Record<TxType, string> = { BUY: "Buy", SELL: "Sell", DIVIDEND: "Dividend", FEE: "Fee", DEMO_CREDIT: "Demo credit" };
const TYPE_TONE: Record<TxType, BadgeTone> = { BUY: "info", SELL: "brand", DIVIDEND: "up", FEE: "down", DEMO_CREDIT: "warn" };

export interface TransactionsTableProps {
  transactions: TransactionRow[];
  currency?: string;
  pageSize?: number;
  compact?: boolean;
  className?: string;
}

/** Filterable (type, date range, search) transaction history with client-side pagination. */
export function TransactionsTable({ transactions, currency = "USD", pageSize = 20, compact = false, className }: TransactionsTableProps) {
  const [type, setType] = React.useState<TxType | "ALL">("ALL");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    const fromTs = from ? new Date(from).getTime() : -Infinity;
    const toTs = to ? new Date(to).getTime() + 86_400_000 - 1 : Infinity;
    return transactions.filter((t) => {
      if (type !== "ALL" && t.type !== type) return false;
      const ts = new Date(t.occurredAt).getTime();
      if (ts < fromTs || ts > toTs) return false;
      if (needle && !`${t.symbol ?? ""} ${t.note ?? ""} ${TYPE_LABEL[t.type]}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [transactions, type, from, to, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className={cn("space-y-3", className)} data-testid="transactions-table">
      {!compact && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-ink-500">
            Search
            <Input value={q} onChange={(e) => resetPage(setQ)(e.target.value)} placeholder="Symbol or note" className="mt-1 h-9 text-xs" />
          </label>
          <label className="text-xs text-ink-500">
            Type
            <Select value={type} onChange={(e) => resetPage(setType)(e.target.value as TxType | "ALL")} className="mt-1 h-9 text-xs">
              <option value="ALL">All types</option>
              {(Object.keys(TYPE_LABEL) as TxType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-xs text-ink-500">
            From
            <Input type="date" value={from} max={to || undefined} onChange={(e) => resetPage(setFrom)(e.target.value)} className="mt-1 h-9 text-xs" />
          </label>
          <label className="text-xs text-ink-500">
            To
            <Input type="date" value={to} min={from || undefined} onChange={(e) => resetPage(setTo)(e.target.value)} className="mt-1 h-9 text-xs" />
          </label>
        </div>
      )}
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <DemoBadge />
        <span>
          {filtered.length} transaction{filtered.length === 1 ? "" : "s"}
        </span>
      </div>
      <Table>
        <THead>
          <tr>
            <TH>Date</TH>
            <TH>Type</TH>
            <TH>Instrument</TH>
            {!compact && <TH align="right">Qty</TH>}
            {!compact && <TH align="right">Price</TH>}
            <TH align="right">Amount</TH>
            {!compact && <TH>Note</TH>}
          </tr>
        </THead>
        <TBody>
          {rows.map((t) => (
            <TR key={t.id}>
              <TD className="whitespace-nowrap text-xs">{formatDateTime(t.occurredAt)}</TD>
              <TD>
                <Badge tone={TYPE_TONE[t.type]}>{TYPE_LABEL[t.type]}</Badge>
              </TD>
              <TD>
                {t.symbol ? (
                  <Link href={`/dashboard/markets/${encodeURIComponent(t.symbol)}`} className="font-semibold text-ink-900 hover:underline">
                    {t.symbol}
                  </Link>
                ) : (
                  <span className="text-ink-300">—</span>
                )}
              </TD>
              {!compact && (
                <TD align="right" numeric>
                  {t.quantity ?? "—"}
                </TD>
              )}
              {!compact && (
                <TD align="right" numeric>
                  {t.price !== null ? formatMoney(t.price, currency, { maximumFractionDigits: 4 }) : "—"}
                </TD>
              )}
              <TD align="right" numeric>
                <MoneyText value={t.amount} currency={currency} signed />
              </TD>
              {!compact && <TD className="max-w-[16rem] truncate text-xs text-ink-500">{t.note ?? ""}</TD>}
            </TR>
          ))}
          {rows.length === 0 && (
            <TR>
              <TD colSpan={compact ? 4 : 7} className="py-8 text-center text-ink-500">
                No transactions match these filters.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
      {pages > 1 && (
        <nav className="flex items-center justify-between text-xs text-ink-500" aria-label="Pagination">
          <span>
            Page {current} of {pages}
          </span>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={current <= 1} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" aria-hidden /> Prev
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={current >= pages} aria-label="Next page">
              Next <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
