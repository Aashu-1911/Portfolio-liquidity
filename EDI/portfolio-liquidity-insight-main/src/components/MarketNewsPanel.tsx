import { useState } from "react";
import { motion } from "framer-motion";
import { Newspaper, ExternalLink, Clock } from "lucide-react";

interface NewsItem {
  id: number;
  headline: string;
  source: string;
  time: string;
  category: "positive" | "negative" | "neutral";
}

const MOCK_NEWS: NewsItem[] = [
  {
    id: 1,
    headline: "RBI keeps repo rate unchanged at 6.5%; focuses on inflation withdrawal",
    source: "Economic Times",
    time: "2h ago",
    category: "neutral",
  },
  {
    id: 2,
    headline: "IT stocks rally after Infosys beats Q3 estimates; TCS, Wipro follow suit",
    source: "Mint",
    time: "3h ago",
    category: "positive",
  },
  {
    id: 3,
    headline: "Fed signals potential rate cuts in H2 2025, markets react positively",
    source: "Reuters",
    time: "4h ago",
    category: "positive",
  },
  {
    id: 4,
    headline: "HDFC Bank sees surge in retail lending; liquidity position remains strong",
    source: "Bloomberg",
    time: "5h ago",
    category: "positive",
  },
  {
    id: 5,
    headline: "S&P 500 dips on weak jobs data; VIX climbs amid heightened uncertainty",
    source: "CNBC",
    time: "6h ago",
    category: "negative",
  },
  {
    id: 6,
    headline: "SEBI tightens F&O regulations; options volume may see short-term impact",
    source: "Business Standard",
    time: "7h ago",
    category: "negative",
  },
  {
    id: 7,
    headline: "Reliance Industries eyes $2B green energy investment in FY26",
    source: "Financial Express",
    time: "8h ago",
    category: "neutral",
  },
  {
    id: 8,
    headline: "NSE records all-time high derivatives volume; cash segment liquidity robust",
    source: "Moneycontrol",
    time: "10h ago",
    category: "positive",
  },
  {
    id: 9,
    headline: "Nikkei falls 1.2% on yen strengthening; Asian markets mixed",
    source: "Reuters",
    time: "11h ago",
    category: "negative",
  },
  {
    id: 10,
    headline: "India GDP growth projected at 7.2% for FY25; IMF raises outlook",
    source: "IMF",
    time: "12h ago",
    category: "positive",
  },
];

export default function MarketNewsPanel() {
  const [activeFilter, setActiveFilter] = useState<"all" | "positive" | "negative" | "neutral">("all");

  const filtered = activeFilter === "all"
    ? MOCK_NEWS
    : MOCK_NEWS.filter((n) => n.category === activeFilter);

  const catColor = (cat: NewsItem["category"]) => {
    if (cat === "positive") return { dot: "#16C784", text: "text-[#16C784]" };
    if (cat === "negative") return { dot: "#EA3943", text: "text-[#EA3943]" };
    return { dot: "#6b7280", text: "text-gray-400" };
  };

  const filters: Array<{ key: typeof activeFilter; label: string }> = [
    { key: "all",      label: "All"      },
    { key: "positive", label: "Positive" },
    { key: "negative", label: "Negative" },
    { key: "neutral",  label: "Neutral"  },
  ];

  return (
    <div className="space-y-3">
      <div className="section-header">
        <Newspaper className="w-4 h-4 text-[#F59E0B]" />
        <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Market News
        </span>
        <div className="flex items-center gap-1 ml-auto">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all"
              style={{
                background: activeFilter === f.key ? "#3B82F620" : "transparent",
                color: activeFilter === f.key ? "#3B82F6" : "#6b7280",
                border: activeFilter === f.key ? "1px solid #3B82F640" : "1px solid transparent",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="glass-card overflow-hidden"
        style={{ maxHeight: "360px", overflowY: "auto" }}
      >
        {filtered.map((item, i) => {
          const c = catColor(item.category);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3 px-4 py-3 border-b border-[#1F2937] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer group"
            >
              {/* Dot indicator */}
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                style={{ background: c.dot }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-200 leading-relaxed group-hover:text-white transition-colors">
                  {item.headline}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] font-semibold text-gray-500">{item.source}</span>
                  <span className="text-gray-700">·</span>
                  <Clock className="w-3 h-3 text-gray-600" />
                  <span className="text-[11px] text-gray-600">{item.time}</span>
                </div>
              </div>

              <ExternalLink className="w-3 h-3 text-gray-700 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
