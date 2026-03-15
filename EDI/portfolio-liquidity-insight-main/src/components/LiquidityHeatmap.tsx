import { motion } from "framer-motion";
import type { AssetResult } from "@/lib/types";

interface LiquidityHeatmapProps {
  assets: AssetResult[];
}

export default function LiquidityHeatmap({ assets }: LiquidityHeatmapProps) {
  if (!assets || assets.length === 0) return null;

  const sorted = [...assets].sort((a, b) => b.liquidity_score - a.liquidity_score);

  const getTheme = (score: number) => {
    if (score >= 0.6) return { bar: "#16C784", glow: "rgba(22,199,132,0.28)", label: "High",   labelColor: "#16C784" };
    if (score >= 0.3) return { bar: "#F59E0B", glow: "rgba(245,158,11,0.22)",  label: "Medium", labelColor: "#F59E0B" };
    return              { bar: "#EA3943", glow: "rgba(234,57,67,0.22)",   label: "Low",    labelColor: "#EA3943" };
  };

  return (
    <div className="dashboard-section">
      {/* Section Header */}
      <div className="section-header">
        <svg className="w-5 h-5 flex-shrink-0" style={{ color: "#3B82F6" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
        <span className="section-title">Stock Liquidity Heatmap</span>
      </div>

      <div className="glass-card" style={{ padding: 24 }}>
        <div className="space-y-4">
          {sorted.map((asset, i) => {
            const c   = getTheme(asset.liquidity_score);
            const pct = Math.round(asset.liquidity_score * 100);
            const w   = `${Math.max(pct, 5)}%`;

            return (
              <motion.div
                key={asset.symbol}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4"
              >
                {/* Symbol label */}
                <span
                  className="w-28 flex-shrink-0 text-right font-mono font-semibold"
                  style={{ fontSize: 13, color: "#D1D5DB" }}
                >
                  {asset.symbol}
                </span>

                {/* Bar track */}
                <div
                  className="flex-1 rounded-full overflow-hidden"
                  style={{ height: 16, background: "#0d1520" }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: w }}
                    transition={{ duration: 0.9, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
                    className="h-full rounded-full flex items-center px-2.5"
                    style={{
                      background: `linear-gradient(90deg, ${c.bar}bb, ${c.bar})`,
                      boxShadow: `0 0 10px ${c.glow}`,
                      minWidth: "5%",
                    }}
                  >
                    <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "rgba(0,0,0,0.75)" }}>
                      {pct}
                    </span>
                  </motion.div>
                </div>

                {/* Score + badge */}
                <div className="w-32 flex-shrink-0 flex items-center gap-2">
                  <span style={{ fontSize: 15, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#FACC15" }}>
                    {pct}
                    <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 400 }}>/100</span>
                  </span>
                  <span
                    className="rounded-md"
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 7px",
                      background: `${c.bar}1a`,
                      color: c.labelColor,
                      border: `1px solid ${c.bar}33`,
                    }}
                  >
                    {c.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div
          className="flex items-center gap-6 mt-6 pt-5"
          style={{ borderTop: "1px solid #1F2937" }}
        >
          {[
            { color: "#16C784", label: "High liquidity (≥ 60)" },
            { color: "#F59E0B", label: "Medium (30–60)" },
            { color: "#EA3943", label: "Low (< 30)" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
              <span style={{ fontSize: 11, color: "#6B7280" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
