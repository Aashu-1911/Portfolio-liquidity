import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Clock, TrendingDown, AlertTriangle, DollarSign, Info
} from "lucide-react";
import type { PortfolioResult } from "@/lib/types";
import LiquidityRiskBar from "./LiquidityRiskBar";

interface ResultsDisplayProps {
  result: PortfolioResult;
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  const riskInfo = {
    Low:      { color: "#16C784", bg: "rgba(22,199,132,0.08)", border: "rgba(22,199,132,0.2)" },
    Moderate: { color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)"  },
    High:     { color: "#EA3943", bg: "rgba(234,57,67,0.08)",   border: "rgba(234,57,67,0.2)"   },
  }[result.risk_level] ?? { color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" };

  const metrics = [
    {
      label: "Risk Level",
      value: result.risk_level,
      icon: Shield,
      color: riskInfo.color,
      bg: riskInfo.bg,
      border: riskInfo.border,
    },
    {
      label: "Liquidation Time",
      value: result.estimated_liquidation_time,
      icon: Clock,
      color: "#3B82F6",
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.2)",
    },
    {
      label: "Price Impact",
      value: result.price_impact,
      icon: TrendingDown,
      color: "#F59E0B",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
    },
    {
      label: "Most Illiquid",
      value: result.most_illiquid_asset,
      icon: AlertTriangle,
      color: "#EA3943",
      bg: "rgba(234,57,67,0.08)",
      border: "rgba(234,57,67,0.2)",
    },
    {
      label: "Portfolio Value",
      value: result.portfolio_value,
      icon: DollarSign,
      color: "#16C784",
      bg: "rgba(22,199,132,0.08)",
      border: "rgba(22,199,132,0.2)",
    },
    {
      label: "Total Positions",
      value: String(result.total_positions),
      icon: Info,
      color: "#6b7280",
      bg: "rgba(107,114,128,0.06)",
      border: "rgba(107,114,128,0.15)",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Liquidity Risk Bar */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <LiquidityRiskBar score={result.liquidity_score} modelUsed={result.model_used} />
      </motion.div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.06 }}
            className="rounded-xl p-3.5"
            style={{ background: m.bg, border: `1px solid ${m.border}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: `${m.color}20` }}
              >
                <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <p className="text-[11px] text-gray-500 font-medium">{m.label}</p>
            </div>
            <p
              className="text-base font-bold font-mono truncate"
              style={{ color: m.color }}
            >
              {m.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Warnings */}
      <AnimatePresence>
        {result.warnings && result.warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl p-4 space-y-2"
            style={{
              background: "rgba(234,57,67,0.06)",
              border: "1px solid rgba(234,57,67,0.25)",
            }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#EA3943]" />
              <span className="text-[11px] font-bold text-[#EA3943] uppercase tracking-widest">
                Risk Warnings
              </span>
            </div>
            {result.warnings.map((w, i) => (
              <p key={i} className="text-xs text-gray-400 pl-5 leading-relaxed">
                · {w}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}