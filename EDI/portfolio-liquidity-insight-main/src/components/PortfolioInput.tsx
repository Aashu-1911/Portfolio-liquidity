import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Trash2, BarChart3, Loader2, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PortfolioAsset } from "@/lib/types";

interface PortfolioInputProps {
  symbols: string[];
  onSubmit: (portfolio: PortfolioAsset[]) => void;
  loading: boolean;
}

export default function PortfolioInput({ symbols, onSubmit, loading }: PortfolioInputProps) {
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([
    { symbol: "AAPL", qty: 50 },
    { symbol: "MSFT", qty: 30 },
    { symbol: "GOOG", qty: 10 },
  ]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filtered = symbols.filter(
    (s) =>
      s.toLowerCase().includes(search.toLowerCase()) &&
      !portfolio.some((p) => p.symbol === s)
  ).slice(0, 8);

  const addSymbol = useCallback((symbol: string) => {
    setPortfolio((p) => [...p, { symbol, qty: 10 }]);
    setSearch("");
    setShowDropdown(false);
  }, []);

  const removeAsset = (index: number) => {
    setPortfolio((p) => p.filter((_, i) => i !== index));
  };

  const updateQty = (index: number, qty: number) => {
    setPortfolio((p) => p.map((a, i) => (i === index ? { ...a, qty: Math.max(1, qty) } : a)));
  };

  return (
    <div className="glass-card p-6 glow-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Portfolio Builder</h2>
          <p className="text-sm text-muted-foreground">Add stocks to analyze liquidity</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search stock symbol..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="pl-10 bg-secondary border-border/50 text-foreground placeholder:text-muted-foreground"
        />
        <AnimatePresence>
          {showDropdown && search && filtered.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto"
            >
              {filtered.map((s) => (
                <button
                  key={s}
                  onClick={() => addSymbol(s)}
                  className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors font-mono"
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Portfolio List */}
      <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {portfolio.map((asset, i) => (
            <motion.div
              key={asset.symbol}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-3 group"
            >
              <span className="font-mono font-semibold text-primary text-sm w-16">
                {asset.symbol}
              </span>
              <Input
                type="number"
                value={asset.qty}
                onChange={(e) => updateQty(i, parseInt(e.target.value) || 1)}
                className="w-24 h-8 text-sm bg-muted border-border/30 text-foreground text-center"
                min={1}
              />
              <span className="text-xs text-muted-foreground">shares</span>
              <button
                onClick={() => removeAsset(i)}
                className="ml-auto opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {portfolio.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Search and add stocks to your portfolio
        </div>
      )}

      <Button
        onClick={() => onSubmit(portfolio)}
        disabled={portfolio.length === 0 || loading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing Portfolio...
          </>
        ) : (
          <>
            <BarChart3 className="w-4 h-4 mr-2" />
            Analyze Liquidity
          </>
        )}
      </Button>
    </div>
  );
}
