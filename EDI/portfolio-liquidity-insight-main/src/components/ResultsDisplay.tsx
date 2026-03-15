import { motion, AnimatePresence } from "framer-motion";
import { Shield, Clock, TrendingDown, AlertTriangle, DollarSign, Info, Download, Loader2 } from "lucide-react";
import type { PortfolioResult } from "@/lib/types";
import LiquidityRiskBar from "./LiquidityRiskBar";

interface ResultsDisplayProps {
  result: PortfolioResult;
  onDownloadReport?: () => void;
  reportLoading?: boolean;
}

export default function ResultsDisplay({ result, onDownloadReport, reportLoading = false }: ResultsDisplayProps) {
  const riskInfo = {
    Low:      { color: "#16C784", bg: "rgba(22,199,132,0.07)", border: "rgba(22,199,132,0.2)" },
    Moderate: { color: "#F59E0B", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.2)"  },
    High:     { color: "#EA3943", bg: "rgba(234,57,67,0.07)",   border: "rgba(234,57,67,0.2)"   },
  }[result.risk_level] ?? { color: "#6B7280", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.2)" };

  const metrics = [
    { label: "Risk Level",        value: result.risk_level,                  icon: Shield,        color: riskInfo.color, bg: riskInfo.bg, border: riskInfo.border },
    { label: "Liquidation Time",  value: result.estimated_liquidation_time,  icon: Clock,         color: "#3B82F6", bg: "rgba(59,130,246,0.07)",  border: "rgba(59,130,246,0.2)" },
    { label: "Price Impact",      value: result.price_impact,                icon: TrendingDown,  color: "#F59E0B", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.2)" },
    { label: "Most Illiquid",     value: result.most_illiquid_asset,         icon: AlertTriangle, color: "#EA3943", bg: "rgba(234,57,67,0.07)",   border: "rgba(234,57,67,0.2)"  },
    { label: "Portfolio Value",   value: result.portfolio_value,             icon: DollarSign,    color: "#16C784", bg: "rgba(22,199,132,0.07)",  border: "rgba(22,199,132,0.2)" },
    { label: "Total Positions",   value: String(result.total_positions),     icon: Info,          color: "#6B7280", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.15)" },
  ];

  return (
    <div className="space-y-5">
      {/* Liquidity risk bar */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <LiquidityRiskBar score={result.liquidity_score} modelUsed={result.model_used} />
      </motion.div>

      {/* Download report */}
      {onDownloadReport && (
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onDownloadReport}
          disabled={reportLoading}
          className="w-full rounded-xl text-sm font-semibold flex items-center justify-center gap-2 py-2.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #0EA5E9, #14B8A6)",
            color: "#020617",
            border: "1px solid rgba(125, 211, 252, 0.35)",
            boxShadow: "0 10px 20px rgba(14, 165, 233, 0.2)",
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {reportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {reportLoading ? "Generating Report..." : "Download Liquidity Report (PDF)"}
        </motion.button>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.06 }}
            whileHover={{ y: -4, boxShadow: "0 10px 24px rgba(15,23,42,0.34)" }}
            className="rounded-xl"
            style={{ padding: "16px 18px", background: m.bg, border: `1px solid ${m.border}` }}
          >
            {/* Icon + title row */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${m.color}20` }}>
                <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <p className="type-card-title leading-tight">{m.label}</p>
            </div>
            {/* Value */}
            <p className="font-mono font-semibold truncate" style={{ fontSize: 17, color: "#FACC15" }}>
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
            className="rounded-xl"
            style={{
              padding: "16px 18px",
              background: "rgba(234,57,67,0.06)",
              border: "1px solid rgba(234,57,67,0.25)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#EA3943" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#EA3943", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Risk Warnings
              </span>
            </div>
            {result.warnings.map((w, i) => (
              <p key={i} style={{ fontSize: 12, color: "#9CA3AF", paddingLeft: 20, lineHeight: 1.6, marginBottom: 2 }}>
                · {w}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}