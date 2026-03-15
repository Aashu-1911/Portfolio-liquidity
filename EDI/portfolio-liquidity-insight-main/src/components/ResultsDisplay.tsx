import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets, Shield, Clock, TrendingDown, AlertTriangle,
  DollarSign, Cpu, Info
} from "lucide-react";
import type { PortfolioResult } from "@/lib/types";

interface ResultsDisplayProps {
  result: PortfolioResult;
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  const riskColor = {
    Low:      "text-success",
    Moderate: "text-warning",
    High:     "text-destructive",
  }[result.risk_level] ?? "text-muted-foreground";

  const riskBg = {
    Low:      "bg-success/10 border-success/20",
    Moderate: "bg-warning/10 border-warning/20",
    High:     "bg-destructive/10 border-destructive/20",
  }[result.risk_level] ?? "";

  // Score arc color
  const gaugeColor =
    result.liquidity_score >= 0.6
      ? "hsl(160, 84%, 44%)"   // green
      : result.liquidity_score >= 0.4
      ? "hsl(38, 92%, 50%)"    // amber
      : "hsl(0, 72%, 55%)";    // red

  const metrics = [
    {
      label: "Risk Level",
      value: result.risk_level,
      icon:  Shield,
      color: riskColor,
      bg:    riskBg,
    },
    {
      label: "Est. Liquidation Time",
      value: result.estimated_liquidation_time,
      icon:  Clock,
      color: "text-accent",
      bg:    "bg-accent/10",
    },
    {
      label: "Expected Price Impact",
      value: result.price_impact,
      icon:  TrendingDown,
      color: "text-chart-amber",
      bg:    "bg-warning/10",
    },
    {
      label: "Most Illiquid Asset",
      value: result.most_illiquid_asset,
      icon:  AlertTriangle,
      color: "text-destructive",
      bg:    "bg-destructive/10",
    },
    {
      label: "Portfolio Value",
      value: result.portfolio_value,
      icon:  DollarSign,
      color: "text-primary",
      bg:    "bg-primary/10",
    },
    {
      label: "Total Positions",
      value: String(result.total_positions),
      icon:  Info,
      color: "text-muted-foreground",
      bg:    "bg-secondary",
    },
  ];

  return (
    <div className="space-y-4">

      {/* ── Score Gauge ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card glow-border p-6 flex flex-col items-center"
      >
        {/* Circular gauge */}
        <div
          className="relative w-36 h-36 rounded-full flex items-center justify-center mb-4"
          style={{
            background: `conic-gradient(
              ${gaugeColor} 0% ${result.liquidity_score * 100}%,
              hsl(220, 14%, 18%) ${result.liquidity_score * 100}% 100%
            )`,
            padding: "3px",
            borderRadius: "50%",
          }}
        >
          <div className="w-full h-full rounded-full bg-card flex items-center justify-center flex-col">
            <span className="text-3xl font-bold font-mono" style={{ color: gaugeColor }}>
              {(result.liquidity_score * 100).toFixed(0)}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
        <h3 className="text-sm font-medium text-muted-foreground">
          Portfolio Liquidity Score
        </h3>

        {/* Model badge */}
        <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border/50">
          <Cpu className="w-3 h-3 text-primary" />
          <span className="text-xs text-muted-foreground font-mono">
            {result.model_used}
          </span>
        </div>
      </motion.div>

      {/* ── Metric Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.07 }}
            className="glass-card p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center shrink-0`}
            >
              <m.icon className={`w-5 h-5 ${m.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className={`text-lg font-semibold font-mono truncate ${m.color}`}>
                {m.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Warnings ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {result.warnings && result.warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card p-4 border border-destructive/30 bg-destructive/5 space-y-2"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <span className="text-xs font-semibold text-destructive uppercase tracking-wider">
                Warnings
              </span>
            </div>
            {result.warnings.map((w, i) => (
              <p key={i} className="text-xs text-muted-foreground pl-6">
                · {w}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}