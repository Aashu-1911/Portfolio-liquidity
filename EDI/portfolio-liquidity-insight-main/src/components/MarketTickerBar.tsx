import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TickerItem {
  name: string;
  value: string;
  change: string;
  pct: number;
}

const INITIAL_TICKERS: TickerItem[] = [
  { name: "NIFTY 50",  value: "22,147.00", change: "+182.30", pct: +0.83 },
  { name: "SENSEX",    value: "73,088.33", change: "+614.11", pct: +0.85 },
  { name: "S&P 500",   value: "5,308.14",  change: "-12.45",  pct: -0.23 },
  { name: "NASDAQ",    value: "16,742.39", change: "+48.20",  pct: +0.29 },
  { name: "VIX",       value: "14.72",     change: "+0.54",   pct: +3.81 },
  { name: "DOW JONES", value: "39,512.84", change: "-82.17",  pct: -0.21 },
  { name: "FTSE 100",  value: "8,194.41",  change: "+32.67",  pct: +0.40 },
  { name: "NIKKEI",    value: "38,405.66", change: "+157.22", pct: +0.41 },
];

function randomNudge(val: number, base: string): TickerItem {
  const delta = (Math.random() - 0.48) * 0.4;
  const pct   = +val + delta;
  const sign  = pct >= 0 ? "+" : "";
  const num   = parseFloat(base.replace(/,/g, ""));
  const newNum = (num * (1 + pct / 100)).toFixed(2);
  const formatted = new Intl.NumberFormat("en-US").format(parseFloat(newNum));
  const chg = ((num * pct) / 100).toFixed(2);
  return { name: "", value: formatted, change: `${sign}${chg}`, pct };
}

export default function MarketTickerBar() {
  const [tickers, setTickers] = useState<TickerItem[]>(INITIAL_TICKERS);

  useEffect(() => {
    const id = setInterval(() => {
      setTickers((prev) =>
        prev.map((t, i) => {
          const nudged = randomNudge(t.pct, t.value);
          return { ...t, value: nudged.value, change: nudged.change, pct: nudged.pct };
        })
      );
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Double the array so seamless scroll loop works
  const doubled = [...tickers, ...tickers];

  return (
    <div
      style={{ background: "#0a0e17", borderBottom: "1px solid #1F2937" }}
      className="overflow-hidden select-none"
    >
      <div className="flex items-center h-9">
        {/* Fixed LIVE badge */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 border-r border-[#1F2937] h-full z-10"
          style={{ background: "#0a0e17" }}>
          <span className="live-dot"></span>
          <span className="text-[10px] font-semibold tracking-widest text-[#16C784] font-mono uppercase">
            LIVE
          </span>
        </div>

        {/* Scrolling ticker */}
        <div className="relative overflow-hidden flex-1">
          <div className="ticker-scroll flex items-center gap-0 whitespace-nowrap">
            {doubled.map((t, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-2 px-5 border-r border-[#1F2937] h-9 text-xs"
              >
                <span className="font-semibold text-gray-300 font-mono tracking-wide">{t.name}</span>
                <span className="font-mono text-white font-medium">{t.value}</span>
                <span
                  className={`flex items-center gap-0.5 font-mono font-semibold ${
                    t.pct >= 0 ? "text-[#16C784]" : "text-[#EA3943]"
                  }`}
                >
                  {t.pct >= 0
                    ? <TrendingUp className="w-3 h-3" />
                    : <TrendingDown className="w-3 h-3" />
                  }
                  {t.pct >= 0 ? "+" : ""}{t.pct.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
