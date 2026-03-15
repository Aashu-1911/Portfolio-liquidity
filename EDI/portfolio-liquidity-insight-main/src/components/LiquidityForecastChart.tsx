import { motion } from "framer-motion";
import {
  Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Area, AreaChart,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";

interface LiquidityForecastChartProps {
  currentLiquidity: number;
  predictions?: {
    tomorrow: number;
    threeDays: number;
    sevenDays: number;
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val  = payload[0]?.value;
  const proj = payload[0]?.payload?.projected;
  return (
    <div className="rounded-xl px-4 py-3" style={{ background: "#1a2235", border: "1px solid #1F2937", minWidth: 120 }}>
      <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 6, fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: 18, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#FACC15" }}>
        {val?.toFixed(1)}
      </p>
      <p style={{ fontSize: 11, color: proj ? "#3B82F6" : "#16C784", marginTop: 2 }}>
        {proj ? "Projected" : "Current"}
      </p>
    </div>
  );
};

export default function LiquidityForecastChart({ currentLiquidity, predictions }: LiquidityForecastChartProps) {
  if (!predictions) return null;

  const cur = currentLiquidity * 100;
  const t1  = predictions.tomorrow   * 100;
  const t3  = predictions.threeDays  * 100;
  const t7  = predictions.sevenDays  * 100;

  const data = [
    { label: "Today",    value: +cur.toFixed(1), projected: false },
    { label: "Tomorrow", value: +t1.toFixed(1),  projected: true },
    { label: "3 Days",   value: +t3.toFixed(1),  projected: true },
    { label: "7 Days",   value: +t7.toFixed(1),  projected: true },
  ];

  const improving = t7 > cur;
  const delta     = (t7 - cur).toFixed(1);
  const minVal    = Math.floor(Math.min(cur, t1, t3, t7) - 6);
  const maxVal    = Math.ceil(Math.max(cur, t1, t3, t7) + 6);

  return (
    <AnimatedSection>
    <div className="dashboard-section">
      {/* Section Header */}
      <div className="section-header">
        <svg className="w-5 h-5 flex-shrink-0" style={{ color: "#3B82F6" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M2 12C2 12 4 6 9 6s7 12 14 12"/>
        </svg>
        <span className="section-title">Liquidity Forecast</span>
        <span
          className="ml-auto rounded-full font-mono text-xs font-semibold px-3 py-1"
          style={{
            background: improving ? "rgba(22,199,132,0.1)" : "rgba(234,57,67,0.1)",
            color: improving ? "#16C784" : "#EA3943",
            border: `1px solid ${improving ? "rgba(22,199,132,0.2)" : "rgba(234,57,67,0.2)"}`,
          }}
        >
          {improving ? `↑ +${delta}` : `↓ ${delta}`} projected
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ padding: 24 }}
      >
        {/* KPI tiles */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {data.map((d, idx) => (
            <motion.div
              key={d.label}
              className="text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * idx, duration: 0.25 }}
            >
              <p style={{ fontSize: 11, color: "#6B7280", fontWeight: 500, marginBottom: 6 }}>{d.label}</p>
              <p style={{
                fontSize: 26,
                fontWeight: 700,
                fontFamily: "'JetBrains Mono',monospace",
                color: "#FACC15",
                lineHeight: 1,
              }}>
                {d.value.toFixed(1)}
              </p>
              <p style={{ fontSize: 10, color: d.projected ? "#3B82F6" : "#16C784", marginTop: 4 }}>
                {d.projected ? "Projected" : "Current"}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Area chart */}
        <ResponsiveContainer width="100%" height={185}>
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" strokeOpacity={0.6} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#9CA3AF", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              domain={[minVal, maxVal]}
              tick={{ fill: "#9CA3AF", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}
              axisLine={false} tickLine={false} width={36}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fill="url(#forecastGrad)"
              dot={{ fill: "#3B82F6", r: 5, strokeWidth: 0 }}
              isAnimationActive
              animationDuration={900}
              animationBegin={120}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#38BDF8"
              strokeWidth={1.4}
              dot={{ r: 4, fill: "#38BDF8" }}
              isAnimationActive
              animationDuration={1000}
              animationBegin={180}
            />
          </AreaChart>
        </ResponsiveContainer>

        <p style={{ fontSize: 11, color: "#4B5563", marginTop: 14, textAlign: "center" }}>
          ML-powered liquidity forecast · Dashed line = current score baseline
        </p>
      </motion.div>
    </div>
    </AnimatedSection>
  );
}
