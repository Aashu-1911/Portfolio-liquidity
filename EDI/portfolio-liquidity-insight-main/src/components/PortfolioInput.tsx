import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, BarChart3, Loader2, TrendingUp, Plus } from "lucide-react";
import type { PortfolioAsset } from "@/lib/types";

interface PortfolioInputProps {
  symbols: string[];
  onSubmit: (portfolio: PortfolioAsset[]) => void;
  onSelectSymbol?: (symbol: string) => void;
  onCompareAll?: () => void;
  selectedSymbol?: string;
  loading: boolean;
}

export default function PortfolioInput({
  symbols,
  onSubmit,
  onSelectSymbol,
  onCompareAll,
  selectedSymbol,
  loading,
}: PortfolioInputProps) {
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
  const [search, setSearch]           = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = symbols
    .filter(
      (s) =>
        s.toLowerCase().includes(search.toLowerCase()) &&
        !portfolio.some((p) => p.symbol === s)
    )
    .slice(0, 8);

  const addSymbol = useCallback((symbol: string) => {
    setPortfolio((p) => [...p, { symbol, qty: 10, price: 100 }]);
    setSearch("");
    setShowDropdown(false);
  }, []);

  const removeAsset = (index: number) => {
    setPortfolio((p) => p.filter((_, i) => i !== index));
  };

  const updateQty = (index: number, qty: number) => {
    setPortfolio((p) =>
      p.map((a, i) => (i === index ? { ...a, qty: Math.max(1, qty) } : a))
    );
  };

  const updatePrice = (index: number, price: number) => {
    setPortfolio((p) =>
      p.map((a, i) => (i === index ? { ...a, price: Math.max(0.01, price) } : a))
    );
  };

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl"
      style={{
        minHeight: 0,
        background: "linear-gradient(165deg, #14233D 0%, #0E1B33 45%, #0B1528 100%)",
        border: "1px solid rgba(59,130,246,0.28)",
        boxShadow: "0 16px 44px rgba(2,6,23,0.55), 0 0 0 1px rgba(59,130,246,0.08), inset 0 1px 0 rgba(147,197,253,0.15)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(400px 180px at 0% 0%, rgba(59,130,246,0.18), transparent 55%), radial-gradient(240px 140px at 100% 100%, rgba(22,199,132,0.12), transparent 65%)",
        }}
      />

      {/* Header */}
      <div
        className="relative px-5 py-4 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(59,130,246,0.24)", background: "linear-gradient(180deg, rgba(59,130,246,0.12), rgba(59,130,246,0.03))" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.35), rgba(22,199,132,0.22))", border: "1px solid rgba(147,197,253,0.28)" }}
        >
          <TrendingUp className="w-4 h-4 text-[#3B82F6]" />
        </div>
        <div className="relative">
          <h2 className="text-sm font-semibold text-gray-200">Watchlist Builder</h2>
          <p className="text-[11px] text-gray-500">{portfolio.length} position{portfolio.length !== 1 ? "s" : ""} added</p>
        </div>
        <span
          className="ml-auto rounded-full px-2.5 py-1 text-[10px] font-semibold"
          style={{
            color: "#7DD3FC",
            border: "1px solid rgba(125,211,252,0.35)",
            background: "rgba(14,116,144,0.18)",
            letterSpacing: "0.04em",
          }}
        >
          LIVE BUILDER
        </span>
        {portfolio.length > 1 && (
          <button
            type="button"
            onClick={onCompareAll}
            className="ml-2 rounded-full px-2.5 py-1 text-[10px] font-semibold"
            style={{
              color: "#FDE68A",
              border: "1px solid rgba(245,158,11,0.55)",
              background: "linear-gradient(135deg, rgba(245,158,11,0.28), rgba(217,119,6,0.22))",
              boxShadow: "0 0 0 1px rgba(245,158,11,0.18), 0 6px 14px rgba(245,158,11,0.18)",
              letterSpacing: "0.04em",
            }}
          >
            COMPARE ALL
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative px-4 py-3" style={{ borderBottom: "1px solid rgba(51,65,85,0.75)" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            placeholder="Search symbol (e.g. AAPL, TSLA)…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-[#0d1520] border border-[#1F2937] rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#3B82F6] transition-colors font-mono"
          />
          <AnimatePresence>
            {showDropdown && search && filtered.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute z-50 top-full mt-1 w-full rounded-xl shadow-2xl overflow-hidden"
                style={{ background: "#1a2235", border: "1px solid #1F2937" }}
              >
                {filtered.map((s) => (
                  <button
                    key={s}
                    onMouseDown={() => addSymbol(s)}
                    className="w-full px-4 py-2.5 text-left text-xs text-gray-300 hover:bg-[#3B82F6]/10 hover:text-[#3B82F6] transition-colors font-mono flex items-center gap-2"
                  >
                    <Plus className="w-3 h-3" />
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Watchlist table header */}
      {portfolio.length > 0 && (
        <div
          className="grid px-4 py-2"
          style={{
            gridTemplateColumns: "1fr 70px 90px 60px 28px",
            borderBottom: "1px solid rgba(51,65,85,0.75)",
            background: "rgba(15,23,42,0.55)",
          }}
        >
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Symbol</span>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest text-right">Shares</span>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest text-right">Price</span>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest text-right">Liq.</span>
          <span />
        </div>
      )}

      {/* Watchlist rows */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 260 }}>
        <AnimatePresence>
          {portfolio.map((asset, i) => (
            <motion.div
              key={asset.symbol}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16, height: 0 }}
              transition={{ delay: i * 0.04 }}
              className="watchlist-row grid items-center px-4 py-2.5 group"
              style={{ gridTemplateColumns: "1fr 70px 90px 60px 28px" }}
              onClick={() => onSelectSymbol?.(asset.symbol)}
            >
              {/* Symbol */}
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: selectedSymbol === asset.symbol ? "#16C784" : "#3B82F6" }}
                />
                <span
                  className="font-mono font-semibold text-sm"
                  style={{ color: selectedSymbol === asset.symbol ? "#16C784" : "#3B82F6" }}
                >
                  {asset.symbol}
                </span>
              </div>

              {/* Qty input */}
              <div className="flex justify-end">
                <input
                  type="number"
                  value={asset.qty}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateQty(i, parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-20 h-7 text-xs bg-[#0d1520] border border-[#1F2937] rounded text-right pr-2 text-gray-200 font-mono focus:outline-none focus:border-[#3B82F6] transition-colors"
                />
              </div>

              {/* Price input */}
              <div className="flex justify-end">
                <input
                  type="number"
                  value={asset.price}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updatePrice(i, parseFloat(e.target.value) || 0.01)}
                  min={0.01}
                  step={0.01}
                  className="w-20 h-7 text-xs bg-[#0d1520] border border-[#1F2937] rounded text-right pr-2 text-gray-200 font-mono focus:outline-none focus:border-[#3B82F6] transition-colors"
                />
              </div>

              {/* Selection badge */}
              <div className="flex justify-end">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-semibold font-mono"
                  style={{
                    background: selectedSymbol === asset.symbol ? "rgba(22,199,132,0.1)" : "rgba(59,130,246,0.1)",
                    color: selectedSymbol === asset.symbol ? "#16C784" : "#3B82F6",
                  }}
                >
                  {selectedSymbol === asset.symbol ? "Single" : "Compare"}
                </span>
              </div>

              {/* Remove */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeAsset(i);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-gray-600 hover:text-[#EA3943]"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {portfolio.length === 0 && (
          <div className="py-10 text-center text-xs text-gray-600">
            Search and add stocks above
          </div>
        )}
      </div>

      {/* Analyze button */}
      <div className="relative p-4" style={{ borderTop: "1px solid rgba(51,65,85,0.75)" }}>
        <motion.button
          onClick={() => onSubmit(portfolio)}
          disabled={portfolio.length === 0 || loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={portfolio.length > 0 && !loading ? { scale: 1.03 } : {}}
          whileTap={portfolio.length > 0 && !loading ? { scale: 0.97 } : {}}
          style={{
            background: loading || portfolio.length === 0
              ? "#1F2937"
              : "linear-gradient(135deg, #16C784, #3B82F6)",
            color: loading || portfolio.length === 0 ? "#6b7280" : "#000",
            boxShadow: portfolio.length > 0 && !loading ? "0 0 24px rgba(22,199,132,0.25)" : undefined,
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing Portfolio…
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4" />
              Analyze Liquidity
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
