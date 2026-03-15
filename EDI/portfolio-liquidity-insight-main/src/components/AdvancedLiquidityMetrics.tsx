import { useState } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import type { AssetResult } from "@/lib/types";

interface AdvancedLiquidityMetricsProps {
  assets: AssetResult[];
}

interface MetricCard {
  name: string;
  value: string;
  tooltip: string;
  color: string;
  bg: string;
  suffix?: string;
}

export default function AdvancedLiquidityMetrics({ assets }: AdvancedLiquidityMetricsProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  if (!assets || assets.length === 0) return null;

  // Compute aggregated metrics from assets
  const avgSpread  = assets.reduce((s, a) => s + a.spread_proxy, 0) / assets.length;
  const avgAmihud  = assets.reduce((s, a) => s + a.amihud_ratio, 0) / assets.length;
  const avgVol     = assets.reduce((s, a) => s + a.volatility,   0) / assets.length;
  const avgScore   = assets.reduce((s, a) => s + a.liquidity_score, 0) / assets.length;

  // Slippage estimate: spread * 2 (simplified)
  const slippage   = avgSpread * 2 * 100;

  // Market depth proxy: higher liquidity score = better depth (1–10 scale)
  const depth      = (avgScore * 10).toFixed(1);

  const metrics: MetricCard[] = [
    {
      name: "Bid-Ask Spread",
      value: (avgSpread * 100).toFixed(3),
      suffix: "%",
      tooltip: "Estimated bid-ask spread as % of price (High-Low)/Close proxy. Lower is better.",
      color: avgSpread < 0.01 ? "#16C784" : avgSpread < 0.02 ? "#F59E0B" : "#EA3943",
      bg: avgSpread < 0.01 ? "rgba(22,199,132,0.08)" : avgSpread < 0.02 ? "rgba(245,158,11,0.08)" : "rgba(234,57,67,0.08)",
    },
    {
      name: "Amihud Illiquidity",
      value: (avgAmihud * 1e6).toFixed(2),
      suffix: "×10⁻⁶",
      tooltip: "|Return|/Volume ratio. Lower value means better liquidity (more volume per unit price move).",
      color: avgAmihud < 0.001 ? "#16C784" : avgAmihud < 0.005 ? "#F59E0B" : "#EA3943",
      bg: avgAmihud < 0.001 ? "rgba(22,199,132,0.08)" : avgAmihud < 0.005 ? "rgba(245,158,11,0.08)" : "rgba(234,57,67,0.08)",
    },
    {
      name: "Market Depth",
      value: depth,
      suffix: "/ 10",
      tooltip: "Estimated market depth score derived from liquidity score. Higher = deeper order book.",
      color: parseFloat(depth) >= 6 ? "#16C784" : parseFloat(depth) >= 4 ? "#F59E0B" : "#EA3943",
      bg: parseFloat(depth) >= 6 ? "rgba(22,199,132,0.08)" : parseFloat(depth) >= 4 ? "rgba(245,158,11,0.08)" : "rgba(234,57,67,0.08)",
    },
    {
      name: "Volume Volatility",
      value: (avgVol * 100).toFixed(3),
      suffix: "%",
      tooltip: "30-day return standard deviation. High volatility increases execution risk.",
      color: avgVol < 0.015 ? "#16C784" : avgVol < 0.025 ? "#F59E0B" : "#EA3943",
      bg: avgVol < 0.015 ? "rgba(22,199,132,0.08)" : avgVol < 0.025 ? "rgba(245,158,11,0.08)" : "rgba(234,57,67,0.08)",
    },
    {
      name: "Slippage Estimate",
      value: slippage.toFixed(3),
      suffix: "%",
      tooltip: "Estimated price slippage on execution (2× spread proxy). Lower is better.",
      color: slippage < 0.02 ? "#16C784" : slippage < 0.04 ? "#F59E0B" : "#EA3943",
      bg: slippage < 0.02 ? "rgba(22,199,132,0.08)" : slippage < 0.04 ? "rgba(245,158,11,0.08)" : "rgba(234,57,67,0.08)",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="section-header">
        <svg className="w-4 h-4 text-[#F59E0B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
        </svg>
        <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Advanced Liquidity Metrics
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            onMouseEnter={() => setHoveredCard(m.name)}
            onMouseLeave={() => setHoveredCard(null)}
            className="relative rounded-xl p-4 cursor-default"
            style={{ background: m.bg, border: `1px solid ${m.color}30` }}
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-[11px] text-gray-400 font-medium leading-tight">{m.name}</p>
              <Info className="w-3 h-3 text-gray-600 flex-shrink-0 mt-0.5" />
            </div>
            <p className="text-lg font-bold font-mono" style={{ color: m.color }}>
              {m.value}
              <span className="text-[11px] font-normal text-gray-500 ml-0.5">{m.suffix}</span>
            </p>

            {/* Tooltip */}
            {hoveredCard === m.name && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-0 mb-2 z-50 w-52 rounded-lg p-3 text-xs text-gray-300 leading-relaxed shadow-xl"
                style={{ background: "#1a2235", border: "1px solid #1F2937" }}
              >
                {m.tooltip}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
