import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, CartesianGrid,
} from "recharts";
import type { PortfolioResult } from "@/lib/types";
import AnimatedSection from "@/components/ui/AnimatedSection";

interface ChartsProps { result: PortfolioResult; }

const COLORS = ["#16C784", "#3B82F6", "#F59E0B", "#EA3943", "#8B5CF6", "#06B6D4", "#F97316"];

const tooltipStyle = {
  backgroundColor: "#1a2235",
  border: "1px solid #1F2937",
  borderRadius: "10px",
  color: "#D1D5DB",
  fontSize: "12px",
  padding: "10px 14px",
};

const axisProps = {
  tick: { fill: "#9CA3AF", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" },
  axisLine: false as const,
  tickLine: false as const,
};

const AllocationTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const value = Number(payload[0]?.value ?? 0);

  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{
        background: "#0B1222",
        border: "1px solid #334155",
        boxShadow: "0 12px 28px rgba(2, 6, 23, 0.55)",
        minWidth: 140,
      }}
    >
      <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6, fontWeight: 600 }}>Portfolio Allocation</p>
      <p style={{ fontSize: 14, color: "#E2E8F0", fontWeight: 700, marginBottom: 2 }}>{row?.name ?? "Asset"}</p>
      <p style={{ fontSize: 17, color: "#FACC15", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
        {value.toFixed(1)}%
      </p>
    </div>
  );
};

const ScoreTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value ?? 0);

  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{
        background: "#0B1222",
        border: "1px solid #334155",
        boxShadow: "0 12px 28px rgba(2, 6, 23, 0.55)",
        minWidth: 140,
      }}
    >
      <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6, fontWeight: 600 }}>Asset Liquidity Score</p>
      <p style={{ fontSize: 14, color: "#E2E8F0", fontWeight: 700, marginBottom: 2 }}>{label ?? "Asset"}</p>
      <p style={{ fontSize: 17, color: "#FACC15", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
        Score: {value.toFixed(1)}
      </p>
    </div>
  );
};

export default function LiquidityCharts({ result }: ChartsProps) {
  const barData = result.assets.map((a) => ({
    name: a.symbol,
    score: Math.round(a.liquidity_score * 100),
  }));

  const pieData = result.assets.map((a) => ({
    name: a.symbol,
    value: Math.round(a.weight * 100),
  }));

  const radarData = result.assets.map((a) => ({
    symbol: a.symbol,
    liquidity: Math.round(a.liquidity_score * 100),
    weight:    Math.round(a.weight * 100),
  }));

  return (
    <AnimatedSection>
    <div className="dashboard-section">
      {/* Section Header */}
      <div className="section-header">
        <svg className="w-5 h-5 flex-shrink-0" style={{ color: "#3B82F6" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M18 20V10M12 20V4M6 20v-6"/>
        </svg>
        <span className="section-title">Portfolio Analytics</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Liquidity Score Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card" style={{ padding: 24 }}>
          <p className="type-card-title mb-5">Asset Liquidity Scores</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={barData} barSize={22} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" strokeOpacity={0.6} vertical={false} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} domain={[0, 100]} />
              <Tooltip content={<ScoreTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
              <Bar dataKey="score" radius={[5, 5, 0, 0]}>
                {barData.map((d, i) => (
                  <Cell key={i} fill={d.score >= 60 ? "#16C784" : d.score >= 30 ? "#F59E0B" : "#EA3943"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Allocation Donut */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card" style={{ padding: 24 }}>
          <p className="type-card-title mb-5">Portfolio Allocation</p>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={82}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
                isAnimationActive
                animationDuration={850}
                animationBegin={180}
              >
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<AllocationTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-3">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span style={{ fontSize: 11, color: "#6B7280" }}>{d.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Radar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card lg:col-span-2 xl:col-span-1" style={{ padding: 24 }}>
          <p className="type-card-title mb-5">Liquidity vs Weight</p>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1F2937" strokeOpacity={0.7} />
              <PolarAngleAxis dataKey="symbol" tick={{ fill: "#9CA3AF", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }} />
              <PolarRadiusAxis tick={{ fill: "#4B5563", fontSize: 10 }} domain={[0, 100]} />
              <Radar name="Liquidity" dataKey="liquidity" stroke="#16C784" fill="#16C784" fillOpacity={0.16} strokeWidth={2} isAnimationActive animationDuration={900} />
              <Radar name="Weight"    dataKey="weight"    stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.10} strokeWidth={1.5} isAnimationActive animationDuration={1000} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 justify-center mt-3">
            {[{ color: "#16C784", label: "Liquidity" }, { color: "#3B82F6", label: "Weight" }].map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <div className="w-5 h-0.5" style={{ background: l.color }} />
                <span style={{ fontSize: 11, color: "#6B7280" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
    </AnimatedSection>
  );
}
