import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import PortfolioInput from "@/components/PortfolioInput";
import ResultsDisplay from "@/components/ResultsDisplay";
import LiquidityCharts from "@/components/LiquidityCharts";
import AssetTable from "@/components/AssetTable";
import FuturePredictions from "@/components/FuturePredictions";
import { getStockSymbols, predictPortfolio, explainPortfolio } from "@/lib/dataEngine";
import type { PortfolioAsset, PortfolioResult } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

const IndexIndia = () => {
  const { user, logout } = useAuth();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPredictions, setAiPredictions] = useState<any>(null);
  const [currentPortfolio, setCurrentPortfolio] = useState<PortfolioAsset[]>([]);

  useEffect(() => {
    // Fetch Indian market symbols
    getStockSymbols("INDIA")
      .then((s) => setSymbols(s))
      .catch(() => setSymbols([]))
      .finally(() => setDataLoading(false));
  }, []);

  const handleSubmit = async (portfolio: PortfolioAsset[]) => {
    setLoading(true);
    setCurrentPortfolio(portfolio);
    try {
      const res = await predictPortfolio(portfolio, "INDIA");
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const handleAiExplain = async () => {
    if (!currentPortfolio.length) return;
    
    setAiLoading(true);
    try {
      const explanation = await explainPortfolio(currentPortfolio, "INDIA");
      setAiPredictions(explanation);
    } catch (error) {
      console.error("AI explanation failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Loading NIFTY 50 dataset & computing features...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              Portfolio Liquidity <span className="text-gradient">Prediction</span>
              <span className="ml-2 text-sm font-normal text-orange-500">🇮🇳 Indian Market</span>
            </h1>
            <p className="text-xs text-muted-foreground">NIFTY 50 · ML-powered analysis · {symbols.length} stocks</p>
            <p className="text-xs text-muted-foreground">Logged in as {user?.name || user?.email}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <a 
              href="/" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Switch to US Market 🇺🇸
            </a>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Input */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <PortfolioInput symbols={symbols} onSubmit={handleSubmit} loading={loading} />
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!result && !loading && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-24 text-center"
                >
                  <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center mb-6">
                    <Activity className="w-10 h-10 text-primary/30" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">No Analysis Yet</h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Build your Indian stock portfolio on the left and click "Analyze Liquidity" to get ML-powered insights.
                  </p>
                </motion.div>
              )}

              {result && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <ResultsDisplay result={result} />
                  
                  {/* AI Predictions Button */}
                  <div className="flex justify-center">
                    <Button
                      onClick={handleAiExplain}
                      disabled={aiLoading}
                      className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating AI Predictions...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Get Future Predictions & AI Analysis
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Future Predictions */}
                  {aiPredictions && (
                    <FuturePredictions
                      symbol="Portfolio"
                      currentLiquidity={aiPredictions.current_liquidity}
                      predictions={{
                        tomorrow: aiPredictions.predicted_liquidity_tomorrow,
                        threeDays: aiPredictions.predicted_liquidity_3_days,
                        sevenDays: aiPredictions.predicted_liquidity_7_days,
                      }}
                      aiExplanation={aiPredictions.ai_explanation}
                    />
                  )}

                  <AssetTable assets={result.assets} />
                  <LiquidityCharts result={result} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IndexIndia;
