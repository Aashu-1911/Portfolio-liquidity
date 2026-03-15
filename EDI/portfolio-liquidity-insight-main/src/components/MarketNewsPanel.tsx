import { useState } from "react";
import { motion } from "framer-motion";
import { Newspaper, ExternalLink, Clock } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";

interface NewsItem {
  id: number;
  headline: string;
  source: string;
  time: string;
  category: "positive" | "negative" | "neutral";
}

const MOCK_NEWS: NewsItem[] = [
  { id: 1, headline: "RBI keeps repo rate unchanged at 6.5%; focuses on inflation withdrawal", source: "Economic Times", time: "2h ago", category: "neutral" },
  { id: 2, headline: "IT stocks rally after Infosys beats Q3 estimates; TCS, Wipro follow suit", source: "Mint", time: "3h ago", category: "positive" },
  { id: 3, headline: "Fed signals potential rate cuts in H2 2025, markets react positively", source: "Reuters", time: "4h ago", category: "positive" },
  { id: 4, headline: "HDFC Bank sees surge in retail lending; liquidity position remains strong", source: "Bloomberg", time: "5h ago", category: "positive" },
  { id: 5, headline: "S&P 500 dips on weak jobs data; VIX climbs amid heightened uncertainty", source: "CNBC", time: "6h ago", category: "negative" },
  { id: 6, headline: "SEBI tightens F&O regulations; options volume may see short-term impact", source: "Business Standard", time: "7h ago", category: "negative" },
  { id: 7, headline: "Reliance Industries eyes $2B green energy investment in FY26", source: "Financial Express", time: "8h ago", category: "neutral" },
  { id: 8, headline: "NSE records all-time high derivatives volume; cash segment liquidity robust", source: "Moneycontrol", time: "10h ago", category: "positive" },
  { id: 9, headline: "Nikkei falls 1.2% on yen strengthening; Asian markets mixed", source: "Reuters", time: "11h ago", category: "negative" },
  { id: 10, headline: "India GDP growth projected at 7.2% for FY25; IMF raises outlook", source: "IMF", time: "12h ago", category: "positive" },
];

export default function MarketNewsPanel() {
  const [activeFilter, setActiveFilter] = useState<"all" | "positive" | "negative" | "neutral">("all");

  const filtered = activeFilter === "all" ? MOCK_NEWS : MOCK_NEWS.filter((n) => n.category === activeFilter);

  const catDot = (cat: NewsItem["category"]) => ({
    positive: "#16C784",
    negative: "#EA3943",
    neutral:  "#6B7280",
  }[cat]);

  const filters: Array<{ key: typeof activeFilter; label: string }> = [
    { key: "all", label: "All" },
    { key: "positive", label: "Positive" },
    { key: "negative", label: "Negative" },
    { key: "neutral",  label: "Neutral"  },
  ];

  return (
    <AnimatedSection>
    <div className="dashboard-section">
      {/* Section Header */}
      <div className="section-header">
        <Newspaper className="w-5 h-5 flex-shrink-0" style={{ color: "#F59E0B" }} />
        <span className="section-title">Market News</span>
        {/* Filter chips */}
        <div className="flex items-center gap-1.5 ml-auto">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className="rounded-full font-medium transition-all"
              style={{
                fontSize: 11,
                padding: "4px 10px",
                background: activeFilter === f.key ? "rgba(59,130,246,0.12)" : "transparent",
                color: activeFilter === f.key ? "#3B82F6" : "#4B5563",
                border: activeFilter === f.key ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden" style={{ maxHeight: 380, overflowY: "auto" }}>
        {filtered.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.035 }}
            whileHover={{ y: -4 }}
            className="flex items-start gap-4 cursor-pointer group"
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid #1F2937",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.018)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {/* Dot */}
            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: catDot(item.category) }} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 13, color: "#D1D5DB", lineHeight: 1.55 }}>
                {item.headline}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>{item.source}</span>
                <span style={{ color: "#374151" }}>·</span>
                <Clock className="w-3 h-3" style={{ color: "#4B5563" }} />
                <span style={{ fontSize: 11, color: "#4B5563" }}>{item.time}</span>
              </div>
            </div>

            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#4B5563" }} />
          </motion.div>
        ))}
      </div>
    </div>
    </AnimatedSection>
  );
}
