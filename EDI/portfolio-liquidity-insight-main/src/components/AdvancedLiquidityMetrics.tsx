import { useState } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import type { AssetResult } from "@/lib/types";
import AnimatedSection from "@/components/ui/AnimatedSection";

interface AdvancedLiquidityMetricsProps {
  assets: AssetResult[];
}

interface MetricCard {
  name: string;
  value: string;
  suffix: string;
  tooltip: string;
  color: string;
  bg: string;
  border: string;
}

export default function AdvancedLiquidityMetrics({ assets }: AdvancedLiquidityMetricsProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  if (!assets || assets.length === 0) return null;

  const avgSpread = assets.reduce((s, a) => s + a.spread_proxy, 0) / assets.length;
  const avgAmihud = assets.reduce((s, a) => s + a.amihud_ratio, 0) / assets.length;
  const avgVol    = assets.reduce((s, a) => s + a.volatility,   0) / assets.length;
  const avgScore  = assets.reduce((s, a) => s + a.liquidity_score, 0) / assets.length;
  const slippage  = avgSpread * 2 * 100;
  const depth     = (avgScore * 10).toFixed(1);

  const getTheme = (good: boolean, warn: boolean) => ({
    color:  good ? "#16C784" : warn ? "#F59E0B" : "#EA3943",
    bg:     good ? "rgba(22,199,132,0.07)"  : warn ? "rgba(245,158,11,0.07)"  : "rgba(234,57,67,0.07)",
    border: good ? "rgba(22,199,132,0.18)"  : warn ? "rgba(245,158,11,0.18)"  : "rgba(234,57,67,0.18)",
  });

  const metrics: MetricCard[] = [
    {
      name: "Bid-Ask Spread",
      value: (avgSpread * 100).toFixed(3),
      suffix: "%",
      tooltip: "Estimated bid-ask spread as % of price (High−Low)/Close. Lower is better.",
      ...getTheme(avgSpread < 0.01, avgSpread < 0.02),
    },
    {
      name: "Amihud Illiquidity",
      value: (avgAmihud * 1e6).toFixed(2),
      suffix: "×10⁻⁶",
      tooltip: "|Return|/Volume ratio. Lower = better liquidity (more volume per unit price move).",
      ...getTheme(avgAmihud < 0.001, avgAmihud < 0.005),
    },
    {
      name: "Market Depth",
      value: depth,
      suffix: "/ 10",
      tooltip: "Estimated market depth score from liquidity score. Higher = deeper order book.",
      ...getTheme(parseFloat(depth) >= 6, parseFloat(depth) >= 4),
    },
    {
      name: "Volume Volatility",
      value: (avgVol * 100).toFixed(3),
      suffix: "%",
      tooltip: "30-day return standard deviation. High volatility increases execution risk.",
      ...getTheme(avgVol < 0.015, avgVol < 0.025),
    },
    {
      name: "Slippage Estimate",
      value: slippage.toFixed(3),
      suffix: "%",
      tooltip: "Estimated execution slippage (2× spread proxy). Lower is better.",
      ...getTheme(slippage < 0.02, slippage < 0.04),
    },
  ];

  return (
    <AnimatedSection>
    <div className="dashboard-section">
      {/* Section Header */}
      <div className="section-header">
        <svg className="w-5 h-5 flex-shrink-0" style={{ color: "#F59E0B" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
        </svg>
        <span className="section-title">Advanced Liquidity Metrics</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        {metrics.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -4 }}
            onMouseEnter={() => setHoveredCard(m.name)}
            onMouseLeave={() => setHoveredCard(null)}
            className="relative rounded-xl cursor-default"
            style={{
              padding: "20px 22px",
              background: m.bg,
              border: `1px solid ${m.border}`,
              transition: "border-color 0.2s, box-shadow 0.2s",
              boxShadow: hoveredCard === m.name ? `0 4px 20px ${m.color}18` : undefined,
            }}
          >
            {/* Card title row */}
            <div className="flex items-start justify-between mb-3">
              <p className="type-card-title leading-tight">{m.name}</p>
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#4B5563" }} />
            </div>

            {/* Metric value */}
            <p style={{ fontSize: 26, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#FACC15", lineHeight: 1.15, letterSpacing: "-0.01em" }}>
              {m.value}
              <span className="type-metric-label ml-1">{m.suffix}</span>
            </p>

            {/* Semantic color dot row */}
            <div className="flex items-center gap-1.5 mt-3">
              <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
              <span style={{ fontSize: 11, color: m.color, fontWeight: 500 }}>
                {m.color === "#16C784" ? "Healthy" : m.color === "#F59E0B" ? "Moderate" : "Critical"}
              </span>
            </div>

            {/* Tooltip */}
            {hoveredCard === m.name && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-0 mb-2 z-50 w-56 rounded-xl p-4 text-xs leading-relaxed shadow-2xl"
                style={{ background: "#1a2235", border: "1px solid #1F2937", color: "#9CA3AF" }}
              >
                {m.tooltip}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
    </AnimatedSection>
  );
}
