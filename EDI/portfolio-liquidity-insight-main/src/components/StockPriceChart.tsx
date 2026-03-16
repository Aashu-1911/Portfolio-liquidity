import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  Bar,
} from "recharts";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { getPriceHistory } from "@/lib/dataEngine";

type TimeRange = "1D" | "5D" | "1M" | "3M" | "1Y";

interface StockPriceChartProps {
  symbol?: string;
  symbols?: string[];
  market?: string;
}

const COLORS = ["#16C784", "#3B82F6", "#F59E0B", "#EA3943", "#A78BFA", "#22D3EE"];

function getCurrencySymbol(market: string): string {
  return market.toUpperCase() === "INDIA" ? "₹" : "$";
}

function fmtCurrency(value: number, market: string): string {
  return `${getCurrencySymbol(market)}${value.toFixed(2)}`;
}

export default function StockPriceChart({ symbol, symbols = [], market = "US" }: StockPriceChartProps) {
  const [range, setRange] = useState<TimeRange>("1M");
  const [historyMap, setHistoryMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  const cleanedSymbols = useMemo(
    () => Array.from(new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))),
    [symbols]
  );

  const singleMode = !!symbol?.trim();
  const chartSymbols = useMemo(() => {
    if (singleMode) return [symbol!.trim().toUpperCase()];
    return cleanedSymbols;
  }, [singleMode, symbol, cleanedSymbols]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!chartSymbols.length) {
        setHistoryMap({});
        return;
      }

      setLoading(true);
      try {
        const data = await getPriceHistory(chartSymbols, range, market);
        if (!cancelled) setHistoryMap(data);
      } catch (err) {
        if (!cancelled) setHistoryMap({});
        console.error("getPriceHistory failed", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [range, market, chartSymbols]);

  const singleSeries = singleMode ? historyMap[chartSymbols[0]] ?? [] : [];

  const compareSeries = useMemo(() => {
    if (singleMode || !chartSymbols.length) return [] as any[];

    const byLabel = new Map<string, any>();

    chartSymbols.forEach((sym) => {
      const points = historyMap[sym] ?? [];
      if (!points.length) return;
      const first = points[0]?.close || 1;

      points.forEach((p: any) => {
        const key = p.label || p.date || String(p.ts);
        if (!byLabel.has(key)) byLabel.set(key, { label: key });
        const row = byLabel.get(key);
        row[sym] = Number(((p.close / first - 1) * 100).toFixed(3));
      });
    });

    return Array.from(byLabel.values());
  }, [singleMode, chartSymbols, historyMap]);

  const current = singleSeries[singleSeries.length - 1]?.close ?? 0;
  const first = singleSeries[0]?.close ?? 0;
  const change = current - first;
  const pct = first > 0 ? (change / first) * 100 : 0;
  const up = change >= 0;

  const ranges: TimeRange[] = ["1D", "5D", "1M", "3M", "1Y"];
  const currencySymbol = getCurrencySymbol(market);

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <TrendingUp className="w-5 h-5 flex-shrink-0" style={{ color: "#3B82F6" }} />
        <span className="section-title">Price Chart</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 24 }}>
        {!chartSymbols.length && (
          <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: 420 }}>
            <p className="text-sm font-semibold text-gray-300 mb-2">Add stocks to view chart</p>
            <p className="text-xs text-gray-600 max-w-sm">Use Watchlist Builder, then click a stock for single view or Compare All mode for portfolio comparison.</p>
          </div>
        )}

        {!!chartSymbols.length && (
          <>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p style={{ fontSize: 11, color: "#6B7280", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>
                  {singleMode ? `${chartSymbols[0]} · ${range}` : `Portfolio Comparison (${chartSymbols.length}) · ${range}`}
                </p>
                {singleMode ? (
                  <>
                    <p style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: "#F9FAFB", lineHeight: 1 }}>
                      {fmtCurrency(current, market)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {up ? <TrendingUp className="w-3.5 h-3.5" style={{ color: "#16C784" }} /> : <TrendingDown className="w-3.5 h-3.5" style={{ color: "#EA3943" }} />}
                      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: up ? "#16C784" : "#EA3943" }}>
                        {up ? "+" : ""}{change.toFixed(2)} ({up ? "+" : ""}{pct.toFixed(2)}%)
                      </span>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: "#9CA3AF" }}>Normalized performance shown as % change from first point.</p>
                )}
              </div>

              <div className="flex gap-1 rounded-lg p-1" style={{ background: "#0d1520" }}>
                {ranges.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className="rounded-md font-mono font-semibold transition-all"
                    style={{
                      fontSize: 12,
                      padding: "5px 10px",
                      background: range === r ? "#1F2937" : "transparent",
                      color: range === r ? "#3B82F6" : "#6B7280",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading market data...
              </div>
            )}

            {!loading && singleMode && (
              <>
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={singleSeries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" strokeOpacity={0.6} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} interval={Math.floor(Math.max(1, singleSeries.length / 6))} />
                    <YAxis tick={{ fill: "#9CA3AF", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} width={54} tickFormatter={(v) => `${currencySymbol}${v.toFixed(0)}`} />
                    <Tooltip formatter={(v: any) => fmtCurrency(Number(v), market)} />
                    <Line type="monotone" dataKey="close" stroke={up ? "#16C784" : "#EA3943"} strokeWidth={2.4} dot={false} />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-2">
                  <ResponsiveContainer width="100%" height={58}>
                    <ComposedChart data={singleSeries} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                      <XAxis dataKey="label" hide />
                      <YAxis hide domain={["auto", "auto"]} />
                      <Bar dataKey="volume" fill="rgba(59,130,246,0.35)" radius={[2, 2, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {!loading && !singleMode && (
              <ResponsiveContainer width="100%" height={290}>
                <LineChart data={compareSeries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" strokeOpacity={0.6} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} interval={Math.floor(Math.max(1, compareSeries.length / 6))} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} width={54} tickFormatter={(v) => `${Number(v).toFixed(1)}%`} />
                  <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)}%`} />
                  {chartSymbols.map((sym, idx) => (
                    <Line key={sym} type="monotone" dataKey={sym} stroke={COLORS[idx % COLORS.length]} strokeWidth={2.2} dot={false} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}

            {!loading && !singleMode && (
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4" style={{ borderTop: "1px solid #1F2937" }}>
                {chartSymbols.map((sym, idx) => (
                  <div key={sym} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[idx % COLORS.length] }} />
                    <span style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'JetBrains Mono',monospace" }}>{sym}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
