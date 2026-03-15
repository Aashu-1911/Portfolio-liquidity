import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Area, AreaChart, Dot
} from "recharts";

interface LiquidityForecastChartProps {
  currentLiquidity: number;
  predictions?: {
    tomorrow: number;
    threeDays: number;
    sevenDays: number;
  };
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  const isProjected = payload?.projected;
  return (
    <circle
      cx={cx} cy={cy} r={5}
      fill={isProjected ? "#3B82F6" : "#16C784"}
      stroke={isProjected ? "#3B82F633" : "#16C78433"}
      strokeWidth={8}
    />
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  const isProj = payload[0]?.payload?.projected;
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "#1a2235", border: "1px solid #1F2937" }}>
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="font-mono font-bold" style={{ color: isProj ? "#3B82F6" : "#16C784" }}>
        Score: {val?.toFixed(1)}
      </p>
      <p className="text-gray-500">{isProj ? "Projected" : "Current"}</p>
    </div>
  );
};

export default function LiquidityForecastChart({ currentLiquidity, predictions }: LiquidityForecastChartProps) {
  if (!predictions) return null;

  const cur = currentLiquidity * 100;
  const t1  = predictions.tomorrow   * 100;
  const t3  = predictions.threeDays  * 100;
  const t7  = predictions.sevenDays  * 100;

  const data = [
    { label: "Today",    value: cur,  projected: false },
    { label: "Tomorrow", value: t1,   projected: true  },
    { label: "3 Days",   value: t3,   projected: true  },
    { label: "7 Days",   value: t7,   projected: true  },
  ];

  const minVal = Math.floor(Math.min(cur, t1, t3, t7) - 5);
  const maxVal = Math.ceil(Math.max(cur, t1, t3, t7) + 5);
  const improving = t7 > cur;

  return (
    <div className="space-y-3">
      <div className="section-header">
        <svg className="w-4 h-4 text-[#3B82F6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M2 12C2 12 4 6 9 6s7 12 14 12"/>
        </svg>
        <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Liquidity Forecast
        </span>
        <span
          className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full font-mono"
          style={{
            background: improving ? "rgba(22,199,132,0.1)" : "rgba(234,57,67,0.1)",
            color: improving ? "#16C784" : "#EA3943",
          }}
        >
          {improving ? `↑ +${(t7 - cur).toFixed(1)}` : `↓ ${(t7 - cur).toFixed(1)}`} projected
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {data.map((d) => (
            <div key={d.label} className="text-center">
              <p className="text-[11px] text-gray-500 mb-1">{d.label}</p>
              <p
                className="text-xl font-bold font-mono"
                style={{ color: d.projected ? "#3B82F6" : "#16C784" }}
              >
                {d.value.toFixed(1)}
              </p>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[minVal, maxVal]}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={cur} stroke="#16C78440" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fill="url(#forecastGrad)"
              dot={<CustomDot />}
            />
          </AreaChart>
        </ResponsiveContainer>

        <p className="text-[11px] text-gray-600 mt-3 text-center">
          ML-powered liquidity forecast · Dashed line = current score
        </p>
      </motion.div>
    </div>
  );
}
