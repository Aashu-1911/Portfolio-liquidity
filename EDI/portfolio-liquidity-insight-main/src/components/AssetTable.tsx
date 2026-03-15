import { motion } from "framer-motion";
import type { AssetResult } from "@/lib/types";

interface Props {
  assets: AssetResult[];
}

export default function AssetTable({ assets }: Props) {
  const riskStyle = (risk: string) => {
    if (risk === "Low")
      return { color: "#16C784", bg: "rgba(22,199,132,0.1)", border: "rgba(22,199,132,0.25)" };
    if (risk === "Moderate")
      return { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)"  };
    return   { color: "#EA3943", bg: "rgba(234,57,67,0.1)",   border: "rgba(234,57,67,0.25)"   };
  };

  const scoreColor = (score: number) =>
    score >= 0.6 ? "#16C784" : score >= 0.3 ? "#F59E0B" : "#EA3943";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: "1px solid #1F2937" }}
      >
        <div>
          <h3 className="text-sm font-semibold text-gray-200">Asset Breakdown</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Per-stock ML liquidity analysis</p>
        </div>
        <span
          className="text-[11px] font-mono px-2 py-0.5 rounded"
          style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}
        >
          {assets.length} position{assets.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "#0d1520", borderBottom: "1px solid #1F2937" }}>
              {[
                ["Symbol", "left"],
                ["Qty", "right"],
                ["Price", "right"],
                ["Value", "right"],
                ["Weight", "right"],
                ["Score", "right"],
                ["Risk", "center"],
                ["Liq. Time", "right"],
                ["Spread", "right"],
                ["Volatility", "right"],
                ["Amihud", "right"],
              ].map(([h, align]) => (
                <th
                  key={h}
                  className="px-4 py-3 font-semibold text-[10px] uppercase tracking-wider text-gray-600"
                  style={{ textAlign: align as any }}
                >
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: sc }} />
                      <span className="font-mono font-bold text-[#3B82F6]">{a.symbol}</span>
                    </div>
                  </td>

                  {/* Qty */}
                  <td className="px-4 py-3 text-right font-mono text-gray-300">
                    {a.qty.toLocaleString()}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 text-right font-mono text-gray-200">
                    ${a.close.toFixed(2)}
                  </td>

                  {/* Value */}
                  <td className="px-4 py-3 text-right font-mono text-gray-200">
                    ${a.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>

                  {/* Weight */}
                  <td className="px-4 py-3 text-right font-mono text-gray-400">
                    {(a.weight * 100).toFixed(1)}%
                  </td>

                  {/* Score */}
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-bold" style={{ color: sc }}>
                      {(a.liquidity_score * 100).toFixed(1)}
                    </span>
                  </td>

                  {/* Risk */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded"
                      style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}
                    >
                      {a.risk_level}
                    </span>
                  </td>

                  {/* Liquidation time */}
                  <td className="px-4 py-3 text-right font-mono text-gray-500 text-[11px]">
                    {a.liquidation_time}
                  </td>

                  {/* Spread */}
                  <td className="px-4 py-3 text-right font-mono text-gray-500 text-[11px]">
                    {(a.spread_proxy * 100).toFixed(3)}%
                  </td>

                  {/* Volatility */}
                  <td className="px-4 py-3 text-right font-mono text-gray-500 text-[11px]">
                    {(a.volatility * 100).toFixed(3)}%
                  </td>

                  {/* Amihud */}
                  <td className="px-4 py-3 text-right font-mono text-gray-500 text-[11px]">
                    {a.amihud_ratio.toFixed(6)}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        className="px-5 py-3 flex flex-wrap gap-x-6 gap-y-1"
        style={{ background: "#0d1520", borderTop: "1px solid #1F2937" }}
      >
        {[
          ["Score", "ML liquidity score (0–100)"],
          ["Spread", "(High−Low)/Close proxy"],
          ["Volatility", "30-day return std dev"],
          ["Amihud", "|Return|/Volume illiquidity"],
        ].map(([k, v]) => (
          <span key={k} className="text-[10px] text-gray-600">
            <span className="text-gray-400 font-medium">{k}</span> — {v}
          </span>
        ))}
      </div>
    </motion.div>
  );
}