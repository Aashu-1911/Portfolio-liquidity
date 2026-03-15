import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StockPriceChartProps {
  symbol?: string;
}

type TimeRange = "1D" | "5D" | "1M" | "3M" | "1Y";

function generateCandles(n: number, startPrice: number) {
  const data: any[] = [];
  let price = startPrice;
  const now = Date.now();
  const msPerCandle = n <= 1 ? 3600000 : n <= 5 ? 3600000 * 4 : 86400000;

  for (let i = 0; i < n; i++) {
    const change = (Math.random() - 0.48) * price * 0.02;
    const open   = price;
    const close  = Math.max(1, price + change);
    const high   = Math.max(open, close) * (1 + Math.random() * 0.008);
    const low    = Math.min(open, close) * (1 - Math.random() * 0.008);
    const volume = Math.floor(100000 + Math.random() * 900000);
    const ma20   = i >= 5
      ? data.slice(Math.max(0, i - 20), i).reduce((s, d) => s + d.close, 0) / Math.min(20, i)
      : null;

    const ts = new Date(now - (n - i) * msPerCandle);
    const label = n <= 1
      ? ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : n <= 5
      ? ts.toLocaleDateString("en-US", { weekday: "short", hour: "2-digit" })
      : ts.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    data.push({ label, open: +open.toFixed(2), close: +close.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), volume, ma20 });
    price = close;
  }
  return data;
}

const CANDLE_COUNTS: Record<TimeRange, number> = {
  "1D": 24, "5D": 30, "1M": 30, "3M": 60, "1Y": 60,
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const bullish = d.close >= d.open;
  return (
    <div className="rounded-xl p-3.5" style={{ background: "#1a2235", border: "1px solid #1F2937", minWidth: 148 }}>
      <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 10, fontWeight: 500 }}>{label}</p>
      {[
        ["O", d.open, "#9CA3AF"],
        ["H", d.high, "#16C784"],
        ["L", d.low,  "#EA3943"],
        ["C", d.close, bullish ? "#16C784" : "#EA3943"],
      ].map(([k, v, c]) => (
        <div key={k as string} className="flex justify-between gap-5 mb-1">
          <span style={{ fontSize: 11, color: "#6B7280" }}>{k}</span>
          <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: c as string }}>${(v as number).toFixed(2)}</span>
        </div>
      ))}
      <div className="flex justify-between gap-5 mt-2 pt-2" style={{ borderTop: "1px solid #1F2937" }}>
        <span style={{ fontSize: 11, color: "#6B7280" }}>Vol</span>
        <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: "#9CA3AF" }}>
          {((d.volume as number) / 1000).toFixed(0)}K
        </span>
      </div>
    </div>
  );
};

export default function StockPriceChart({ symbol }: StockPriceChartProps) {
  const hasSymbol = !!symbol?.trim();
  const [range, setRange] = useState<TimeRange>("1M");
  const [data, setData]   = useState<any[]>([]);

  useEffect(() => {
    if (!hasSymbol) {
      setData([]);
      return;
    }
    setData(generateCandles(CANDLE_COUNTS[range], 100 + Math.random() * 200));
  }, [range, symbol, hasSymbol]);

  const first  = data[0]?.close ?? 0;
  const last   = data[data.length - 1]?.close ?? 0;
  const change = last - first;
  const pct    = first > 0 ? (change / first) * 100 : 0;
  const bull   = change >= 0;
  const lineColor = bull ? "#16C784" : "#EA3943";
  const ranges: TimeRange[] = ["1D", "5D", "1M", "3M", "1Y"];

  return (
    <div className="dashboard-section">
      {/* Section Header */}
      <div className="section-header">
        <TrendingUp className="w-5 h-5 flex-shrink-0" style={{ color: "#3B82F6" }} />
        <span className="section-title">Price Chart</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 24 }}>
        {!hasSymbol && (
          <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: 420 }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <TrendingUp className="w-7 h-7" style={{ color: "rgba(59,130,246,0.5)" }} />
            </div>
            <p className="text-sm font-semibold text-gray-300 mb-2">Choose a stock to view price chart</p>
            <p className="text-xs text-gray-600 max-w-sm">Add a stock in Watchlist Builder and run Analyze Liquidity to load chart data.</p>
          </div>
        )}

        {hasSymbol && (
          <>
        {/* Chart header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p style={{ fontSize: 11, color: "#6B7280", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>
              {symbol} · {range}
            </p>
            <p style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: "#F9FAFB", lineHeight: 1 }}>
              ${last.toFixed(2)}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              {bull
                ? <TrendingUp className="w-3.5 h-3.5" style={{ color: lineColor }} />
                : <TrendingDown className="w-3.5 h-3.5" style={{ color: lineColor }} />}
              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: lineColor }}>
                {bull ? "+" : ""}{change.toFixed(2)} ({bull ? "+" : ""}{pct.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Range selector */}
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

        {/* Price line */}
        <ResponsiveContainer width="100%" height={210}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" strokeOpacity={0.6} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#9CA3AF", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}
              axisLine={false} tickLine={false}
              interval={Math.floor(data.length / 6)}
            />
            <YAxis
              tick={{ fill: "#9CA3AF", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}
              axisLine={false} tickLine={false} width={54}
              domain={["auto", "auto"]}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="ma20" stroke="#F59E0B" strokeWidth={1.5}
              dot={false} strokeDasharray="4 2" connectNulls isAnimationActive animationDuration={700} />
            <Line type="monotone" dataKey="close" stroke={lineColor} strokeWidth={2.5} dot={false} isAnimationActive animationDuration={900} animationBegin={80} />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Volume */}
        <div className="mt-2">
          <ResponsiveContainer width="100%" height={52}>
            <ComposedChart data={data} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={["auto", "auto"]} />
              <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.close >= d.open ? "rgba(22,199,132,0.35)" : "rgba(234,57,67,0.35)"} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-4 pt-4" style={{ borderTop: "1px solid #1F2937" }}>
          {[
            { dashed: false, color: lineColor, label: "Price" },
            { dashed: true,  color: "#F59E0B", label: "MA 20" },
            { box: true,     color: "rgba(22,199,132,0.35)", label: "Volume" },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              {l.box
                ? <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                : <div className="w-6 h-0.5" style={{
                    background: l.dashed ? "transparent" : l.color,
                    borderTop: l.dashed ? `1.5px dashed ${l.color}` : undefined,
                  }} />}
              <span style={{ fontSize: 11, color: "#6B7280" }}>{l.label}</span>
            </div>
          ))}
        </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
