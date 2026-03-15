import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Lightbulb, Brain } from "lucide-react";

interface AIInsightCardsProps {
  aiExplanation?: string;
  riskLevel?: string;
  liquidityScore?: number;
}

function parseInsights(text: string, risk: string, score: number) {
  // Try to extract structured sections from the AI text
  const lower = text.toLowerCase();
  
  // Trend: look for improving/declining signals
  let trend = "Liquidity conditions are being monitored across portfolio assets.";
  if (lower.includes("improv")) trend = "Liquidity is expected to improve based on current market conditions.";
  else if (lower.includes("declin") || lower.includes("worsen")) trend = "Liquidity may face headwinds in the near term.";
  else if (lower.includes("stable")) trend = "Market trends indicate stable liquidity over the coming sessions.";

  // Risk factors
  let riskFactor = "Standard market risk factors apply. Review concentration in top holdings.";
  if (lower.includes("concentrat")) riskFactor = "Portfolio concentration detected. High exposure in a single asset may amplify liquidity risk.";
  else if (lower.includes("volatil")) riskFactor = "Elevated volatility detected in one or more assets, increasing liquidation time.";
  else if (risk === "High") riskFactor = "High portfolio risk level detected. Immediate diversification recommended.";

  // Recommendation
  let rec = "Monitor bid-ask spreads and consider rebalancing toward higher-volume assets.";
  if (score < 0.4) rec = "Diversify into high-volume, liquid stocks to reduce liquidation risk.";
  else if (score >= 0.6) rec = "Portfolio liquidity is healthy. Maintain diversification for continued stability.";
  else rec = "Consider partial rebalancing toward large-cap liquid assets to improve score.";

  return { trend, riskFactor, rec };
}

export default function AIInsightCards({ aiExplanation, riskLevel = "Moderate", liquidityScore = 0.5 }: AIInsightCardsProps) {
  const { trend, riskFactor, rec } = parseInsights(
    aiExplanation ?? "",
    riskLevel,
    liquidityScore
  );

  const cards = [
    {
      icon: TrendingUp,
      title: "Market Trend",
      content: trend,
      variant: "insight-trend",
      iconColor: "#3B82F6",
      delay: 0,
    },
    {
      icon: AlertTriangle,
      title: "Risk Factors",
      content: riskFactor,
      variant: "insight-risk",
      iconColor: "#EA3943",
      delay: 0.1,
    },
    {
      icon: Lightbulb,
      title: "Recommendation",
      content: rec,
      variant: "insight-rec",
      iconColor: "#16C784",
      delay: 0.2,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="section-header">
        <Brain className="w-4 h-4 text-[#3B82F6]" />
        <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          AI Liquidity Insights
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: card.delay, duration: 0.4 }}
            className={`rounded-xl p-4 ${card.variant}`}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${card.iconColor}18` }}
              >
                <card.icon className="w-4 h-4" style={{ color: card.iconColor }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  {card.title}
                </p>
                <p className="text-sm text-gray-200 leading-relaxed">{card.content}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {aiExplanation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl p-4 mt-2"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid #1F2937",
          }}
        >
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">
            Full AI Analysis
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">{aiExplanation}</p>
        </motion.div>
      )}
    </div>
  );
}
