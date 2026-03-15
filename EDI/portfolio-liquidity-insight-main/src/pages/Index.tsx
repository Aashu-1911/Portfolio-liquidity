import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Loader2, Sparkles, LogOut, Globe, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

import MarketTickerBar          from "@/components/MarketTickerBar";
import PortfolioInput           from "@/components/PortfolioInput";
import ResultsDisplay           from "@/components/ResultsDisplay";
import LiquidityCharts          from "@/components/LiquidityCharts";
import AssetTable               from "@/components/AssetTable";
import FuturePredictions        from "@/components/FuturePredictions";
import StockPriceChart          from "@/components/StockPriceChart";
import LiquidityHeatmap         from "@/components/LiquidityHeatmap";
import AdvancedLiquidityMetrics from "@/components/AdvancedLiquidityMetrics";
import MarketNewsPanel          from "@/components/MarketNewsPanel";
import AIInsightCards           from "@/components/AIInsightCards";

import { getStockSymbols, predictPortfolio, explainPortfolio } from "@/lib/dataEngine";
import type { PortfolioAsset, PortfolioResult } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { user, logout } = useAuth();
  const [symbols, setSymbols]           = useState<string[]>([]);
  const [loading, setLoading]           = useState(false);
  const [dataLoading, setDataLoading]   = useState(true);
  const [result, setResult]             = useState<PortfolioResult | null>(null);
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiPredictions, setAiPredictions] = useState<any>(null);
  const [currentPortfolio, setCurrentPortfolio] = useState<PortfolioAsset[]>([]);
  const [selectedSymbol, setSelectedSymbol]     = useState("AAPL");

  useEffect(() => {
    getStockSymbols("US")
      .then((s) => setSymbols(s))
      .catch(() => setSymbols([]))
      .finally(() => setDataLoading(false));
  }, []);

  const handleSubmit = async (portfolio: PortfolioAsset[]) => {
    setLoading(true);
    setCurrentPortfolio(portfolio);
    if (portfolio.length > 0) setSelectedSymbol(portfolio[0].symbol);
    try {
      const res = await predictPortfolio(portfolio, "US");
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const handleAiExplain = async () => {
    if (!currentPortfolio.length) return;
    setAiLoading(true);
    try {
      const explanation = await explainPortfolio(currentPortfolio, "US");
      setAiPredictions(explanation);
    } catch (error) {
      console.error("AI explanation failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#0B0F19" }}>
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(22,199,132,0.1)", border: "1px solid rgba(22,199,132,0.2)" }}>
            <Activity className="w-8 h-8 text-[#16C784]" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0B0F19]"
            style={{ background: "#16C784", boxShadow: "0 0 8px #16C784" }} />
        </div>
        <div className="text-center">
          <p className="text-gray-200 font-semibold mb-1">Loading S&P 500 Dataset</p>
          <p className="text-gray-600 text-sm">Computing ML features…</p>
        </div>
        <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0B0F19" }}>

      {/* ─── TICKER ─────────────────────────────────────────── */}
      <MarketTickerBar />

      {/* ─── HEADER ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40"
        style={{ background: "rgba(11,15,25,0.95)", borderBottom: "1px solid #1F2937", backdropFilter: "blur(20px)" }}
      >
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#16C784,#3B82F6)" }}>
              <Activity className="w-4 h-4 text-black" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">
                LiquidityAI{" "}
                <span className="text-[11px] font-normal text-gray-500 ml-1">🇺🇸 US Market</span>
              </h1>
              <p className="text-[10px] text-gray-600 font-mono">S&P 500 · {symbols.length} stocks · ML-powered</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1 ml-6">
            {["Dashboard", "Portfolio", "Analytics"].map((tab, i) => (
              <button key={tab} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                style={{ color: i === 0 ? "#3B82F6" : "#6b7280", background: i === 0 ? "rgba(59,130,246,0.1)" : "transparent" }}>
                {tab}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <a href="/india"
              className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#3B82F6] transition-colors px-3 py-1.5 rounded-lg"
              style={{ border: "1px solid #1F2937" }}>
              <Globe className="w-3.5 h-3.5" />
              India Market 🇮🇳
              <ChevronRight className="w-3 h-3" />
            </a>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-300"
                style={{ background: "#1F2937" }}>
                {(user?.name || user?.email || "U")[0].toUpperCase()}
              </div>
              <span className="hidden md:inline">{user?.name || user?.email}</span>
            </div>
            <button onClick={logout}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#EA3943] transition-colors px-2 py-1.5">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── MAIN ───────────────────────────────────────────── */}
      <main className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">

        {/* Zone 1: Watchlist | Price Chart | Liquidity Score */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-20">
              <PortfolioInput symbols={symbols} onSubmit={handleSubmit} loading={loading} />
            </div>
          </div>

          <div className="lg:col-span-5">
            <StockPriceChart symbol={selectedSymbol} />
          </div>

          <div className="lg:col-span-4">
            <AnimatePresence mode="wait">
              {!result && !loading && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="glass-card flex flex-col items-center justify-center text-center p-10 h-full" style={{ minHeight: 340 }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
                    <Activity className="w-8 h-8" style={{ color: "rgba(59,130,246,0.4)" }} />
                  </div>
                  <h2 className="text-base font-semibold text-gray-300 mb-2">Awaiting Portfolio</h2>
                  <p className="text-xs text-gray-600 max-w-xs">Add stocks to the watchlist and click "Analyze Liquidity" to get ML-powered insights.</p>
                </motion.div>
              )}

              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="glass-card flex flex-col items-center justify-center p-10 h-full" style={{ minHeight: 340 }}>
                  <Loader2 className="w-8 h-8 text-[#16C784] animate-spin mb-4" />
                  <p className="text-sm text-gray-400 font-medium">Running ML Analysis…</p>
                  <p className="text-xs text-gray-600 mt-1">Computing liquidity features</p>
                </motion.div>
              )}

              {result && !loading && (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ResultsDisplay result={result} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Zone 2–5: Only visible after analysis */}
        <AnimatePresence>
          {result && (
            <motion.div key="analysis" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-6">

              {/* Advanced Metrics */}
              <AdvancedLiquidityMetrics assets={result.assets} />

              {/* Zone 3: Forecast | AI Insights | News */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Forecast */}
                <div>
                  {aiPredictions ? (
                    <FuturePredictions
                      symbol="Portfolio"
                      currentLiquidity={aiPredictions.current_liquidity}
                      predictions={{
                        tomorrow:  aiPredictions.predicted_liquidity_tomorrow,
                        threeDays: aiPredictions.predicted_liquidity_3_days,
                        sevenDays: aiPredictions.predicted_liquidity_7_days,
                      }}
                      riskLevel={result.risk_level}
                    />
                  ) : (
                    <div className="glass-card flex flex-col items-center justify-center text-center p-8 h-full" style={{ minHeight: 220 }}>
                      <Sparkles className="w-7 h-7 mb-3" style={{ color: "rgba(59,130,246,0.4)" }} />
                      <p className="text-xs text-gray-600 mb-4">Run AI analysis to see the liquidity forecast chart</p>
                      <Button onClick={handleAiExplain} disabled={aiLoading} size="sm"
                        style={{ background: "linear-gradient(135deg,#3B82F6,#16C784)", color: "#000", border: "none" }}>
                        {aiLoading
                          ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Analyzing…</>
                          : <><Sparkles className="w-3 h-3 mr-1" /> Get AI Predictions</>}
                      </Button>
                    </div>
                  )}
                </div>

                {/* AI Insights */}
                <div>
                  {aiPredictions ? (
                    <AIInsightCards
                      aiExplanation={aiPredictions.ai_explanation}
                      riskLevel={result.risk_level}
                      liquidityScore={aiPredictions.current_liquidity}
                    />
                  ) : (
                    <div className="glass-card flex flex-col items-center justify-center text-center p-8 h-full" style={{ minHeight: 220 }}>
                      <p className="text-xs text-gray-600">AI Insights will appear here after analysis</p>
                    </div>
                  )}
                </div>

                {/* News */}
                <div>
                  <MarketNewsPanel />
                </div>
              </div>

              {/* Zone 4: Heatmap | Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4">
                  <LiquidityHeatmap assets={result.assets} />
                </div>
                <div className="lg:col-span-8">
                  <LiquidityCharts result={result} />
                </div>
              </div>

              {/* Zone 5: Asset Table */}
              <AssetTable assets={result.assets} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pre-analysis: news + how-it-works */}
        {!result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MarketNewsPanel />
            <div className="glass-card p-6">
              <div className="section-header mb-4">
                <Activity className="w-4 h-4 text-[#3B82F6]" />
                <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">How It Works</span>
              </div>
              <div className="space-y-4">
                {[
                  { step: "01", title: "Build Watchlist", desc: "Search and add S&P 500 stocks to your portfolio on the left panel." },
                  { step: "02", title: "Analyze", desc: "Click 'Analyze Liquidity' to run ML inference on your holdings." },
                  { step: "03", title: "Review Results", desc: "View liquidity scores, risk ratings, heatmaps and advanced metrics." },
                  { step: "04", title: "Get AI Insights", desc: "Generate AI-powered explanations and future liquidity forecasts." },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <span className="text-[11px] font-mono font-bold text-[#3B82F6] w-6 flex-shrink-0 mt-0.5">{item.step}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-300">{item.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
