import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
} from "recharts";
import type { PortfolioResult } from "@/lib/types";

interface ChartsProps {
  result: PortfolioResult;
}

const COLORS = [
  "hsl(160, 84%, 44%)",
  "hsl(200, 80%, 55%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 55%)",
  "hsl(270, 70%, 60%)",
  "hsl(160, 60%, 60%)",
  "hsl(200, 60%, 70%)",
];

const customTooltipStyle = {
  backgroundColor: "hsl(220, 18%, 9%)",
  border: "1px solid hsl(220, 14%, 18%)",
  borderRadius: "8px",
  color: "hsl(210, 20%, 92%)",
  fontSize: "12px",
};

export default function LiquidityCharts({ result }: ChartsProps) {
  const barData = result.assets.map((a) => ({
    name: a.symbol,
    score: Math.round(a.liquidity_score * 100),
  }));

  const riskData = result.assets.map((a) => ({
    name: a.symbol,
    risk: a.risk_level === "Low" ? 1 : a.risk_level === "Moderate" ? 2 : 3,
  }));

  const pieData = result.assets.map((a) => ({
    name: a.symbol,
    value: Math.round(a.weight * 100),
  }));

  const radarData = result.assets.map((a) => ({
    symbol: a.symbol,
    liquidity: Math.round(a.liquidity_score * 100),
    weight: Math.round(a.weight * 100),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Liquidity Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">Asset Liquidity Scores</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} barSize={28}>
            <XAxis dataKey="name" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: "hsl(220, 14%, 10%)" }} />
            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
              {barData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Portfolio Allocation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">Portfolio Allocation</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={customTooltipStyle} formatter={(v: number) => `${v}%`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {pieData.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              {d.name}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Risk Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">Risk Assessment</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={riskData} barSize={28} layout="vertical">
            <XAxis type="number" domain={[0, 3]} tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => ["", "Low", "Mod", "High"][v] || ""} />
            <YAxis type="category" dataKey="name" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
            <Tooltip contentStyle={customTooltipStyle} formatter={(v: number) => ["", "Low", "Moderate", "High"][v]} />
            <Bar dataKey="risk" radius={[0, 6, 6, 0]}>
              {riskData.map((d, i) => (
                <Cell key={i} fill={d.risk === 1 ? COLORS[0] : d.risk === 2 ? COLORS[2] : COLORS[3]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Radar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">Liquidity vs Weight</h3>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="hsl(220, 14%, 18%)" />
            <PolarAngleAxis dataKey="symbol" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} />
            <PolarRadiusAxis tick={{ fill: "hsl(215, 12%, 40%)", fontSize: 10 }} domain={[0, 100]} />
            <Radar name="Liquidity" dataKey="liquidity" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.2} />
            <Radar name="Weight" dataKey="weight" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.15} />
            <Tooltip contentStyle={customTooltipStyle} />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
