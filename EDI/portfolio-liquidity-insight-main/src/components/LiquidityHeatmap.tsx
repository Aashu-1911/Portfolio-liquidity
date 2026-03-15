import { motion } from "framer-motion";
import type { AssetResult } from "@/lib/types";

interface LiquidityHeatmapProps {
  assets: AssetResult[];
}

export default function LiquidityHeatmap({ assets }: LiquidityHeatmapProps) {
  if (!assets || assets.length === 0) return null;

  // Sort by score descending
  const sorted = [...assets].sort((a, b) => b.liquidity_score - a.liquidity_score);

  const getColor = (score: number) => {
    if (score >= 0.6) return { bar: "#16C784", glow: "rgba(22,199,132,0.25)", label: "High" };
    if (score >= 0.3) return { bar: "#F59E0B", glow: "rgba(245,158,11,0.2)", label: "Medium" };
    return            { bar: "#EA3943", glow: "rgba(234,57,67,0.2)",  label: "Low" };
  };

  return (
    <div className="space-y-3">
      <div className="section-header">
        <svg className="w-4 h-4 text-[#3B82F6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
        <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Stock Liquidity Heatmap
        </span>
      </div>

      <div className="glass-card p-5 space-y-3">
        {sorted.map((asset, i) => {
          const c     = getColor(asset.liquidity_score);
          const pct   = Math.round(asset.liquidity_score * 100);
          const width = `${Math.max(pct, 4)}%`;

          return (
            <motion.div
              key={asset.symbol}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3"
            >
              {/* Symbol */}
              <span className="w-24 text-xs font-mono font-semibold text-gray-300 flex-shrink-0 text-right">
                {asset.symbol}
              </span>

              {/* Bar track */}
              <div className="flex-1 h-6 rounded-md overflow-hidden relative" style={{ background: "#1a2235" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width }}
                  transition={{ duration: 0.9, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
                  className="h-full rounded-md flex items-center px-2"
                  style={{
                    background: `linear-gradient(90deg, ${c.bar}cc, ${c.bar})`,
                    boxShadow: `0 0 8px ${c.glow}`,
                    minWidth: "4%",
                  }}
                >
                  <span className="text-[10px] font-mono font-bold text-black/80 whitespace-nowrap">
                    {pct}
                  </span>
                </motion.div>
              </div>

              {/* Score & label */}
              <div className="w-24 flex-shrink-0 flex items-center gap-2">
                <span className="text-xs font-mono font-semibold" style={{ color: c.bar }}>
                  {pct}/100
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                  style={{ background: `${c.bar}20`, color: c.bar }}
                >
                  {c.label}
                </span>
              </div>
            </motion.div>
          );
        })}

        {/* Legend */}
        <div className="flex items-center gap-5 pt-3 border-t border-[#1F2937]">
          {[
            { color: "#16C784", label: "High (≥60)" },
            { color: "#F59E0B", label: "Medium (30–60)" },
            { color: "#EA3943", label: "Low (<30)" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
