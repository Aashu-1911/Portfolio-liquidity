import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Lightbulb, Brain } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";

interface AIInsightCardsProps {
  aiExplanation?: string;
  riskLevel?: string;
  liquidityScore?: number;
}

function parseInsights(text: string, risk: string, score: number) {
  const lower = text.toLowerCase();

  let trend = "Liquidity conditions are being monitored across portfolio assets.";
  if (lower.includes("improv")) trend = "Liquidity is expected to improve based on current market conditions.";
  else if (lower.includes("declin") || lower.includes("worsen")) trend = "Liquidity may face headwinds in the near term.";
  else if (lower.includes("stable")) trend = "Market trends indicate stable liquidity over the coming sessions.";

  let riskFactor = "Standard market risk factors apply. Review concentration in top holdings.";
  if (lower.includes("concentrat")) riskFactor = "Portfolio concentration detected. High exposure in a single asset may amplify liquidity risk.";
  else if (lower.includes("volatil")) riskFactor = "Elevated volatility detected in one or more assets, increasing liquidation time.";
  else if (risk === "High") riskFactor = "High portfolio risk level detected. Consider immediate diversification.";

  let rec = "Monitor bid-ask spreads and consider rebalancing toward higher-volume assets.";
  if (score < 0.4) rec = "Diversify into high-volume liquid stocks to reduce liquidation risk.";
  else if (score >= 0.6) rec = "Portfolio liquidity is healthy. Maintain diversification for continued stability.";
  else rec = "Consider partial rebalancing toward large-cap liquid assets to improve score.";

  return { trend, riskFactor, rec };
}

export default function AIInsightCards({ aiExplanation, riskLevel = "Moderate", liquidityScore = 0.5 }: AIInsightCardsProps) {
  const { trend, riskFactor, rec } = parseInsights(aiExplanation ?? "", riskLevel, liquidityScore);

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
    <AnimatedSection>
    <div className="dashboard-section">
      {/* Section Header */}
      <div className="section-header">
        <Brain className="w-5 h-5 flex-shrink-0" style={{ color: "#3B82F6" }} />
        <span className="section-title">AI Liquidity Insights</span>
      </div>

      <div className="flex flex-col gap-4">
        {cards.map((card) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: card.delay, duration: 0.4 }}
            whileHover={{ y: -4 }}
            className={`rounded-xl ${card.variant}`}
            style={{ padding: "18px 20px" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${card.iconColor}18` }}
              >
                <card.icon className="w-4 h-4" style={{ color: card.iconColor }} />
              </div>
              <div>
                {/* Card title */}
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                  {card.title}
                </p>
                {/* Content */}
                <p style={{ fontSize: 14, color: "#D1D5DB", lineHeight: 1.6 }}>
                  {card.content}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Full AI explanation */}
      {aiExplanation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl mt-4"
          style={{
            padding: "16px 20px",
            background: "rgba(255,255,255,0.018)",
            border: "1px solid #1F2937",
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            Full AI Analysis
          </p>
          <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.7 }}>{aiExplanation}</p>
        </motion.div>
      )}
    </div>
    </AnimatedSection>
  );
}
