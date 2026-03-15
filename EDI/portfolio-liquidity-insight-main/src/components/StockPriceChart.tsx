import { useState, useEffect, useRef } from "react";
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

// Generate OHLCV candle data
function generateCandles(n: number, startPrice: number) {
  const data: any[] = [];
  let price = startPrice;
  const now = Date.now();
  const msPerCandle = (n <= 1 ? 3600000 : n <= 5 ? 3600000 * 4 : 86400000);

  for (let i = 0; i < n; i++) {
    const change = (Math.random() - 0.48) * price * 0.02;
    const open   = price;
    const close  = Math.max(1, price + change);
    const high   = Math.max(open, close) * (1 + Math.random() * 0.008);
    const low    = Math.min(open, close) * (1 - Math.random() * 0.008);
    const volume = Math.floor(100000 + Math.random() * 900000);
    const ma20   = i >= 5 ? data.slice(Math.max(0, i - 20), i).reduce((s, d) => s + d.close, 0) / Math.min(20, i) : null;

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
    <div className="rounded-lg p-3 text-xs" style={{ background: "#1a2235", border: "1px solid #1F2937", minWidth: 140 }}>
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">O</span>
          <span className="font-mono text-white">${d.open}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">H</span>
          <span className="font-mono text-[#16C784]">${d.high}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">L</span>
          <span className="font-mono text-[#EA3943]">${d.low}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">C</span>
          <span className={`font-mono font-bold ${bullish ? "text-[#16C784]" : "text-[#EA3943]"}`}>${d.close}</span>
        </div>
        <div className="border-t border-gray-700 pt-1 mt-1 flex justify-between gap-4">
          <span className="text-gray-500">Vol</span>
          <span className="font-mono text-gray-300">{(d.volume / 1000).toFixed(0)}K</span>
        </div>
      </div>
    </div>
  );
};

// Candlestick rendered as thin/wide bar combo
const CandleBar = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload || width <= 0) return null;
  const bullish = payload.close >= payload.open;
  const color   = bullish ? "#16C784" : "#EA3943";
  const bodyTop = Math.min(y, y + height);
  const bodyH   = Math.max(1, Math.abs(height));

  // Prices for wick
  const priceRange = payload.high - payload.low;
  if (priceRange === 0) return null;
  const totalPx = props.yMax - props.yMin || 1;

  return (
    <g>
      {/* Body */}
      <rect x={x + 1} y={bodyTop} width={width - 2} height={bodyH} fill={color} opacity={0.9} rx={1} />
    </g>
  );
};

export default function StockPriceChart({ symbol = "AAPL" }: StockPriceChartProps) {
  const [range, setRange] = useState<TimeRange>("1M");
  const [data, setData] = useState(() => generateCandles(CANDLE_COUNTS["1M"], 180));

  useEffect(() => {
    const startPrice = 100 + Math.random() * 200;
    setData(generateCandles(CANDLE_COUNTS[range], startPrice));
  }, [range, symbol]);

  const first = data[0]?.close ?? 0;
  const last  = data[data.length - 1]?.close ?? 0;
  const change = last - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;
  const bullish = change >= 0;
  const lineColor = bullish ? "#16C784" : "#EA3943";

  const ranges: TimeRange[] = ["1D", "5D", "1M", "3M", "1Y"];

  return (
    <div className="space-y-3">
      <div className="section-header">
        <TrendingUp className="w-4 h-4 text-[#3B82F6]" />
        <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Price Chart
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        {/* Chart header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 font-mono mb-1">{symbol} · {range}</p>
            <p className="text-2xl font-bold font-mono text-white">${last.toFixed(2)}</p>
            <p className={`flex items-center gap-1 text-sm font-semibold font-mono mt-0.5 ${bullish ? "text-[#16C784]" : "text-[#EA3943]"}`}>
              {bullish ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {bullish ? "+" : ""}{change.toFixed(2)} ({bullish ? "+" : ""}{changePct.toFixed(2)}%)
            </p>
          </div>

          {/* Time range buttons */}
          <div className="flex gap-1 bg-[#0d1520] rounded-lg p-1">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="text-xs px-2.5 py-1.5 rounded-md font-mono font-medium transition-all"
                style={{
                  background: range === r ? "#1F2937" : "transparent",
                  color: range === r ? "#3B82F6" : "#6b7280",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Price chart */}
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#6b7280", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(data.length / 6)}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={50}
              domain={["auto", "auto"]}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* MA20 line */}
            <Line
              type="monotone"
              dataKey="ma20"
              stroke="#F59E0B"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
              connectNulls
            />
            {/* Price close line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Volume chart */}
        <ResponsiveContainer width="100%" height={55}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="label" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.close >= d.open ? "#16C78440" : "#EA394340"} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 inline-block" style={{ background: lineColor }} />
            Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 inline-block border-t border-dashed border-[#F59E0B]" />
            MA 20
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 inline-block rounded-sm bg-[#16C78440]" />
            Volume
          </span>
        </div>
      </motion.div>
    </div>
  );
}
