import { motion } from "framer-motion";
import { TrendingUp, Calendar, Brain, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FuturePredictionsProps {
  symbol: string;
  currentLiquidity: number;
  predictions?: {
    tomorrow: number;
    threeDays: number;
    sevenDays: number;
  };
  aiExplanation?: string;
}

export default function FuturePredictions({ 
  symbol, 
  currentLiquidity, 
  predictions,
  aiExplanation 
}: FuturePredictionsProps) {
  
  if (!predictions) return null;

  const getTrendColor = (current: number, future: number) => {
    const diff = future - current;
    if (diff > 0.05) return "text-success";
    if (diff < -0.05) return "text-destructive";
    return "text-warning";
  };

  const getTrendIcon = (current: number, future: number) => {
    return future > current ? "↗" : future < current ? "↘" : "→";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Future Predictions Card */}
      <Card className="glass-card glow-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle>Future Liquidity Predictions</CardTitle>
          </div>
          <CardDescription>
            ML-powered forecasts for {symbol}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tomorrow */}
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="text-xs text-muted-foreground mb-1">Tomorrow (t+1)</div>
              <div className={`text-2xl font-bold font-mono ${getTrendColor(currentLiquidity, predictions.tomorrow)}`}>
                {(predictions.tomorrow * 100).toFixed(1)}
                <span className="text-lg ml-1">{getTrendIcon(currentLiquidity, predictions.tomorrow)}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {predictions.tomorrow > currentLiquidity ? "Improving" : predictions.tomorrow < currentLiquidity ? "Declining" : "Stable"}
              </div>
            </div>

            {/* 3 Days */}
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="text-xs text-muted-foreground mb-1">In 3 Days (t+3)</div>
              <div className={`text-2xl font-bold font-mono ${getTrendColor(currentLiquidity, predictions.threeDays)}`}>
                {(predictions.threeDays * 100).toFixed(1)}
                <span className="text-lg ml-1">{getTrendIcon(currentLiquidity, predictions.threeDays)}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {predictions.threeDays > currentLiquidity ? "Improving" : predictions.threeDays < currentLiquidity ? "Declining" : "Stable"}
              </div>
            </div>

            {/* 7 Days */}
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="text-xs text-muted-foreground mb-1">In 7 Days (t+7)</div>
              <div className={`text-2xl font-bold font-mono ${getTrendColor(currentLiquidity, predictions.sevenDays)}`}>
                {(predictions.sevenDays * 100).toFixed(1)}
                <span className="text-lg ml-1">{getTrendIcon(currentLiquidity, predictions.sevenDays)}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {predictions.sevenDays > currentLiquidity ? "Improving" : predictions.sevenDays < currentLiquidity ? "Declining" : "Stable"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Explanation Card */}
      {aiExplanation && (
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <CardTitle>AI Analysis</CardTitle>
            </div>
            <CardDescription>
              LangChain-powered explanation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">
              {aiExplanation}
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
