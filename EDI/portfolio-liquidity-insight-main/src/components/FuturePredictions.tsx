import { motion } from "framer-motion";
import { Brain, Sparkles, Loader2 } from "lucide-react";
import LiquidityForecastChart from "./LiquidityForecastChart";
import AIInsightCards from "./AIInsightCards";
import { Button } from "@/components/ui/button";

interface FuturePredictionsProps {
  symbol: string;
  currentLiquidity: number;
  predictions?: {
    tomorrow: number;
    threeDays: number;
    sevenDays: number;
  };
  aiExplanation?: string;
  riskLevel?: string;
  onAiExplain?: () => void;
  aiLoading?: boolean;
}

export default function FuturePredictions({
  symbol,
  currentLiquidity,
  predictions,
  aiExplanation,
  riskLevel,
  onAiExplain,
  aiLoading,
}: FuturePredictionsProps) {
  if (!predictions) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Forecast Chart */}
      <LiquidityForecastChart
        currentLiquidity={currentLiquidity}
        predictions={predictions}
      />

      {/* AI Insights */}
      {aiExplanation && (
        <AIInsightCards
          aiExplanation={aiExplanation}
          riskLevel={riskLevel}
          liquidityScore={currentLiquidity}
        />
      )}

      {/* Trigger button if no explanation yet */}
      {!aiExplanation && onAiExplain && (
        <div className="text-center">
          <Button
            onClick={onAiExplain}
            disabled={aiLoading}
            className="font-semibold text-sm"
            style={{
              background: "linear-gradient(135deg, #3B82F6, #16C784)",
              color: "#000",
              border: "none",
            }}
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating AI Analysis…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get AI Analysis
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
