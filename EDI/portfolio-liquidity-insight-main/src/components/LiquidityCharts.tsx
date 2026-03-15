import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import type { PortfolioResult } from "@/lib/types";

interface ChartsProps {
  result: PortfolioResult;
}

const COLORS = [
  "#16C784", "#3B82F6", "#F59E0B", "#EA3943", "#8B5CF6", "#06B6D4", "#F97316",
];

const tooltipStyle = {
  backgroundColor: "#1a2235",
  border: "1px solid #1F2937",
  borderRadius: "10px",
  color: "#e5e7eb",
  fontSize: "12px",
  padding: "8px 12px",
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
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Liquidity Score Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-5"
      >
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Asset Liquidity Scores
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} barSize={24}>
            <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
            <Bar dataKey="score" radius={[5, 5, 0, 0]}>
              {barData.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.score >= 60 ? "#16C784" : d.score >= 30 ? "#F59E0B" : "#EA3943"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Portfolio Allocation Donut */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-5"
      >
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Portfolio Allocation
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
          {pieData.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              {d.name}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Risk Radar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-5 lg:col-span-2 xl:col-span-1"
      >
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Liquidity vs Weight
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#1F2937" />
            <PolarAngleAxis dataKey="symbol" tick={{ fill: "#6b7280", fontSize: 10 }} />
            <PolarRadiusAxis tick={{ fill: "#4b5563", fontSize: 9 }} domain={[0, 100]} />
            <Radar
              name="Liquidity"
              dataKey="liquidity"
              stroke="#16C784"
              fill="#16C784"
              fillOpacity={0.18}
              strokeWidth={2}
            />
            <Radar
              name="Weight"
              dataKey="weight"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.12}
              strokeWidth={1.5}
            />
            <Tooltip contentStyle={tooltipStyle} />
          </RadarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 justify-center mt-1">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <div className="w-5 h-0.5 bg-[#16C784]" /> Liquidity
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <div className="w-5 h-0.5 bg-[#3B82F6]" /> Weight
          </div>
        </div>
      </motion.div>
    </div>
  );
}
