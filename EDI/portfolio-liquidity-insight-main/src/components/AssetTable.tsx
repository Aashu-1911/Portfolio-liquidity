import { motion } from "framer-motion";
import type { AssetResult } from "@/lib/types";

interface Props { assets: AssetResult[]; }

export default function AssetTable({ assets }: Props) {
  const riskStyle = (risk: string) => {
    if (risk === "Low")
      return { color: "#16C784", bg: "rgba(22,199,132,0.1)",  border: "rgba(22,199,132,0.25)" };
    if (risk === "Moderate")
      return { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)"  };
    return  { color: "#EA3943", bg: "rgba(234,57,67,0.1)",    border: "rgba(234,57,67,0.25)"   };
  };
  const scoreColor = (s: number) => s >= 0.6 ? "#16C784" : s >= 0.3 ? "#F59E0B" : "#EA3943";

  const COLS = [
    { h: "Symbol",     align: "left"   },
    { h: "Qty",        align: "right"  },
    { h: "Price",      align: "right"  },
    { h: "Value",      align: "right"  },
    { h: "Weight",     align: "right"  },
    { h: "Score",      align: "right"  },
    { h: "Risk",       align: "center" },
    { h: "Liq. Time",  align: "right"  },
    { h: "Spread",     align: "right"  },
    { h: "Volatility", align: "right"  },
    { h: "Amihud",     align: "right"  },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="dashboard-section">
      {/* Section Header */}
      <div className="section-header">
        <svg className="w-5 h-5 flex-shrink-0" style={{ color: "#6B7280" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
        </svg>
        <span className="section-title">Asset Breakdown</span>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #1F2937" }}>
          <p className="type-card-title">Per-stock ML liquidity analysis</p>
          <span
            className="rounded font-mono"
            style={{ fontSize: 11, padding: "3px 10px", background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}
          >
            {assets.length} position{assets.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#0d1520", borderBottom: "1px solid #1F2937" }}>
                {COLS.map(({ h, align }) => (
                  <th key={h} className="px-4 py-3"
                    style={{ textAlign: align as any, fontSize: 10, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.map((a, i) => {
                const rs = riskStyle(a.risk_level);
                const sc = scoreColor(a.liquidity_score);
                return (
                  <motion.tr
                    key={a.symbol}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.04 * i }}
                    className="watchlist-row group"
                  >
                    {/* Symbol */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: sc }} />
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#3B82F6", fontSize: 13 }}>
                          {a.symbol}
                        </span>
                      </div>
                    </td>
                    {/* Qty */}
                    <td className="px-4 py-3.5 text-right">
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#D1D5DB" }}>
                        {a.qty.toLocaleString()}
                      </span>
                    </td>
                    {/* Price */}
                    <td className="px-4 py-3.5 text-right">
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#F9FAFB" }}>
                        ${a.close.toFixed(2)}
                      </span>
                    </td>
                    {/* Value */}
                    <td className="px-4 py-3.5 text-right">
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#F9FAFB" }}>
                        ${a.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    {/* Weight */}
                    <td className="px-4 py-3.5 text-right">
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#9CA3AF" }}>
                        {(a.weight * 100).toFixed(1)}%
                      </span>
                    </td>
                    {/* Score */}
                    <td className="px-4 py-3.5 text-right">
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: "#FACC15" }}>
                        {(a.liquidity_score * 100).toFixed(1)}
                      </span>
                    </td>
                    {/* Risk */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="rounded" style={{
                        fontSize: 10, fontWeight: 700, padding: "3px 10px",
                        background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`,
                      }}>
                        {a.risk_level}
                      </span>
                    </td>
                    {/* Liq time */}
                    <td className="px-4 py-3.5 text-right">
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#6B7280" }}>
                        {a.liquidation_time}
                      </span>
                    </td>
                    {/* Spread */}
                    <td className="px-4 py-3.5 text-right">
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#6B7280" }}>
                        {(a.spread_proxy * 100).toFixed(3)}%
                      </span>
                    </td>
                    {/* Volatility */}
                    <td className="px-4 py-3.5 text-right">
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#6B7280" }}>
                        {(a.volatility * 100).toFixed(3)}%
                      </span>
                    </td>
                    {/* Amihud */}
                    <td className="px-4 py-3.5 text-right">
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#6B7280" }}>
                        {a.amihud_ratio.toFixed(6)}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer legend */}
        <div className="flex flex-wrap gap-x-8 gap-y-2 px-6 py-4" style={{ background: "#0d1520", borderTop: "1px solid #1F2937" }}>
          {[
            ["Score",      "ML liquidity score (0–100)"],
            ["Spread",     "(High−Low)/Close proxy"],
            ["Volatility", "30-day return std dev"],
            ["Amihud",     "|Return|/Volume illiquidity"],
          ].map(([k, v]) => (
            <span key={k} style={{ fontSize: 11, color: "#4B5563" }}>
              <span style={{ color: "#9CA3AF", fontWeight: 500 }}>{k}</span> — {v}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}