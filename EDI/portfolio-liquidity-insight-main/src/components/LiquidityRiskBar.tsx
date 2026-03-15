import { motion } from "framer-motion";
import { Cpu } from "lucide-react";

interface LiquidityRiskBarProps {
  score: number;       // 0..1
  modelUsed?: string;
}

export default function LiquidityRiskBar({ score, modelUsed }: LiquidityRiskBarProps) {
  const pct = Math.round(score * 100);

  const theme =
    pct >= 60
      ? { bar: "#16C784", label: "Highly Liquid",      textColor: "#16C784" }
      : pct >= 30
      ? { bar: "#F59E0B", label: "Moderate Liquidity",  textColor: "#F59E0B" }
      : { bar: "#EA3943", label: "Illiquid",            textColor: "#EA3943" };

  return (
    <div className="glass-card glow-border" style={{ padding: 24 }}>
      {/* Score row */}
      <div className="flex items-start justify-between mb-5">
        <div>
          {/* Section-level card title */}
          <p className="type-card-title mb-1">Portfolio Liquidity Score</p>
          {/* Big metric value */}
          <div className="flex items-end gap-2">
            <p style={{
              fontSize: 40,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono',monospace",
              lineHeight: 1,
              color: "#FACC15",
              letterSpacing: "-0.02em",
            }}>
              {pct}
            </p>
            <span style={{ fontSize: 16, color: "#4B5563", fontFamily: "'JetBrains Mono',monospace", paddingBottom: 4 }}>
              / 100
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Liquidity label badge */}
          <span
            className="rounded-full font-semibold"
            style={{
              fontSize: 12,
              padding: "4px 12px",
              background: `${theme.bar}1a`,
              color: theme.textColor,
              border: `1px solid ${theme.bar}40`,
            }}
          >
            {theme.label}
          </span>
          {modelUsed && (
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3" style={{ color: "#3B82F6" }} />
              <span style={{ fontSize: 11, color: "#6B7280", fontFamily: "'JetBrains Mono',monospace" }}>
                {modelUsed}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bar track */}
      <div
        className="relative rounded-full overflow-hidden mb-3"
        style={{
          height: 18,
          background: "linear-gradient(90deg,rgba(234,57,67,0.15) 0%,rgba(245,158,11,0.15) 42%,rgba(22,199,132,0.15) 100%)",
        }}
      >
        {/* Zone dividers */}
        <div className="absolute inset-0 flex pointer-events-none">
          <div style={{ width: "30%" }} className="border-r border-white/10" />
          <div style={{ width: "30%" }} className="border-r border-white/10" />
        </div>

        {/* Fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          className="h-full rounded-full relative"
          style={{
            background: "linear-gradient(90deg,#EA3943 0%,#F59E0B 40%,#16C784 100%)",
            maxWidth: `${pct}%`,
            boxShadow: `0 0 14px ${theme.bar}60`,
          }}
        >
          {/* Thumb */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full border-2 border-white"
            style={{ width: 14, height: 14, background: theme.bar, boxShadow: `0 0 8px ${theme.bar}` }}
          />
        </motion.div>
      </div>

      {/* Zone labels */}
      <div className="flex justify-between">
        <span style={{ fontSize: 12, color: "#EA3943", fontWeight: 500 }}>Illiquid</span>
        <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 500 }}>Moderate</span>
        <span style={{ fontSize: 12, color: "#16C784", fontWeight: 500 }}>Liquid</span>
      </div>
      <div className="flex justify-between mt-0.5">
        <span style={{ fontSize: 10, color: "#4B5563", fontFamily: "'JetBrains Mono',monospace" }}>0</span>
        <span style={{ fontSize: 10, color: "#4B5563", fontFamily: "'JetBrains Mono',monospace" }}>30</span>
        <span style={{ fontSize: 10, color: "#4B5563", fontFamily: "'JetBrains Mono',monospace" }}>60</span>
        <span style={{ fontSize: 10, color: "#4B5563", fontFamily: "'JetBrains Mono',monospace" }}>100</span>
      </div>
    </div>
  );
}
