import { motion } from "framer-motion";
import type { AssetResult } from "@/lib/types";

interface Props {
  assets: AssetResult[];
}

export default function AssetTable({ assets }: Props) {
  const riskColor = (risk: string) => {
    if (risk === "Low")      return "text-success bg-success/10";
    if (risk === "Moderate") return "text-warning bg-warning/10";
    return "text-destructive bg-destructive/10";
  };

  const scoreColor = (score: number) => {
    if (score >= 0.6) return "text-success";
    if (score >= 0.4) return "text-warning";
    return "text-destructive";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground">Asset Breakdown</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Per-stock ML features and liquidity metrics
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs border-b border-border/30 bg-secondary/30">
              {/* Identity */}
              <th className="text-left  px-4 py-3 font-medium">Symbol</th>
              <th className="text-right px-4 py-3 font-medium">Qty</th>
              <th className="text-right px-4 py-3 font-medium">Close</th>
              <th className="text-right px-4 py-3 font-medium">Value</th>
              <th className="text-right px-4 py-3 font-medium">Weight</th>
              {/* ML outputs */}
              <th className="text-right px-4 py-3 font-medium">Score</th>
              <th className="text-center px-4 py-3 font-medium">Risk</th>
              <th className="text-right px-4 py-3 font-medium">Liq. Time</th>
              {/* ML features */}
              <th className="text-right px-4 py-3 font-medium">Spread</th>
              <th className="text-right px-4 py-3 font-medium">Volatility</th>
              <th className="text-right px-4 py-3 font-medium">Amihud</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a, i) => (
              <motion.tr
                key={a.symbol}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="border-b border-border/20 hover:bg-secondary/30 transition-colors"
              >
                {/* Symbol */}
                <td className="px-4 py-3 font-mono font-semibold text-primary">
                  {a.symbol}
                </td>

                {/* Qty */}
                <td className="px-4 py-3 text-right text-foreground font-mono">
                  {a.qty.toLocaleString()}
                </td>

                {/* Close price */}
                <td className="px-4 py-3 text-right text-foreground font-mono">
                  ${a.close.toFixed(2)}
                </td>

                {/* Position value */}
                <td className="px-4 py-3 text-right text-foreground font-mono">
                  ${a.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>

                {/* Weight */}
                <td className="px-4 py-3 text-right text-muted-foreground font-mono">
                  {(a.weight * 100).toFixed(1)}%
                </td>

                {/* Liquidity score */}
                <td className={`px-4 py-3 text-right font-mono font-semibold ${scoreColor(a.liquidity_score)}`}>
                  {(a.liquidity_score * 100).toFixed(1)}
                </td>

                {/* Risk badge */}
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${riskColor(a.risk_level)}`}>
                    {a.risk_level}
                  </span>
                </td>

                {/* Liquidation time */}
                <td className="px-4 py-3 text-right text-muted-foreground font-mono text-xs">
                  {a.liquidation_time}
                </td>

                {/* Spread proxy */}
                <td className="px-4 py-3 text-right text-muted-foreground font-mono text-xs">
                  {(a.spread_proxy * 100).toFixed(3)}%
                </td>

                {/* Volatility */}
                <td className="px-4 py-3 text-right text-muted-foreground font-mono text-xs">
                  {(a.volatility * 100).toFixed(3)}%
                </td>

                {/* Amihud ratio */}
                <td className="px-4 py-3 text-right text-muted-foreground font-mono text-xs">
                  {a.amihud_ratio.toFixed(6)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-border/30 bg-secondary/20 flex flex-wrap gap-x-6 gap-y-1">
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Score</span> — ML liquidity score (0–100)
        </span>
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Spread</span> — (High−Low)/Close proxy
        </span>
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Volatility</span> — 30-day return std dev
        </span>
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Amihud</span> — |Return|/Volume illiquidity ratio
        </span>
      </div>
    </motion.div>
  );
}