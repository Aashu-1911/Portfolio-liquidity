// ── Old browser-engine types (no longer used, kept to avoid breaking imports) ──
export interface RawStockRow {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ProcessedStock {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  daily_return: number;
  volatility: number;
  normalized_volume: number;
}

export interface LiquidityFeatures {
  symbol: string;
  spread_proxy: number;
  volatility: number;
  turnover_proxy: number;
  amihud_ratio: number;
  avg_volume: number;
  avg_close: number;
  liquidity_score: number;
  normalized_volume: number;
  normalized_spread: number;
  normalized_volatility: number;
  normalized_amihud: number;
}

// ── Active types used by Flask backend ────────────────────────────────────────

export interface PortfolioAsset {
  symbol: string;
  qty: number;
  price: number;
}

export interface AssetResult {
  symbol:          string;
  qty:             number;
  close:           number;   // stock price
  liquidity_score: number;
  weight:          number;   // 0–1 fraction
  value:           number;   // position value in $
  avg_volume:      number;
  risk_level:      string;   // "Low" | "Moderate" | "High"
  liquidation_time: string;
  // ML feature values
  spread_proxy:    number;
  volatility:      number;
  amihud_ratio:    number;
}

export interface PortfolioResult {
  liquidity_score:            number;
  risk_level:                 string;   // "Low" | "Moderate" | "High"
  estimated_liquidation_time: string;
  price_impact:               string;
  most_illiquid_asset:        string;
  assets:                     AssetResult[];
  // New fields from Flask
  portfolio_value:            string;   // "$24,326.00"
  model_used:                 string;   // "Gradient Boosting"
  total_positions:            number;
  warnings?:                  string[]; // optional warning messages
}