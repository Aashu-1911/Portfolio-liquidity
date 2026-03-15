import { motion } from "framer-motion";
import { Cpu } from "lucide-react";

interface LiquidityRiskBarProps {
  score: number;       // 0..1 floating
  modelUsed?: string;
}

export default function LiquidityRiskBar({ score, modelUsed }: LiquidityRiskBarProps) {
  const pct = Math.round(score * 100);

  const color =
    pct >= 60
      ? { bar: "#16C784", label: "Highly Liquid",   text: "text-[#16C784]", zone: "Liquid" }
      : pct >= 30
      ? { bar: "#F59E0B", label: "Moderate Liquidity", text: "text-[#F59E0B]", zone: "Moderate" }
      : { bar: "#EA3943", label: "Illiquid",         text: "text-[#EA3943]", zone: "Illiquid" };

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Portfolio Liquidity Score
          </h3>
          <p className={`text-3xl font-bold font-mono mt-1 ${color.text}`}>
            {pct}
            <span className="text-base font-normal text-gray-500 ml-1">/ 100</span>
          </p>
        </div>
        <div className="text-right">
          <span
            className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${color.text}`}
            style={{ background: `${color.bar}20`, border: `1px solid ${color.bar}40` }}
          >
            {color.label}
          </span>
          {modelUsed && (
            <div className="flex items-center gap-1.5 mt-2 justify-end">
              <Cpu className="w-3 h-3 text-[#3B82F6]" />
              <span className="text-xs text-gray-500 font-mono">{modelUsed}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bar track */}
      <div className="relative h-5 rounded-full overflow-hidden mb-3"
        style={{ background: "linear-gradient(90deg, #EA394320 0%, #F59E0B20 42%, #16C78420 100%)" }}>

        {/* Zone markers */}
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
            background: `linear-gradient(90deg, #EA3943 0%, #F59E0B 40%, ${color.bar} 100%)`,
            maxWidth: `${pct}%`,
            boxShadow: `0 0 12px ${color.bar}60`,
          }}
        >
          {/* Thumb */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white"
            style={{ background: color.bar, boxShadow: `0 0 8px ${color.bar}` }}
          />
        </motion.div>
      </div>

      {/* Zone labels */}
      <div className="flex justify-between text-[11px] font-mono">
        <span className="text-[#EA3943]">Illiquid</span>
        <span className="text-[#F59E0B]">Moderate</span>
        <span className="text-[#16C784]">Liquid</span>
      </div>

      {/* Score ticks */}
      <div className="flex justify-between text-[10px] text-gray-600 font-mono mt-1">
        <span>0</span>
        <span>30</span>
        <span>60</span>
        <span>100</span>
      </div>
    </div>
  );
}
