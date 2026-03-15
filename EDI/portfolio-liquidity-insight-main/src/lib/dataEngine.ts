import type { PortfolioAsset, PortfolioResult } from "./types";

// ── Flask API base URL ─────────────────────────────────────────────────────────
const API_BASE = resolveApiBase();

if (typeof window !== "undefined") {
  console.info("[ML API] Base URL:", API_BASE);
}

function resolveApiBase(): string {
  const fromEnv = (import.meta.env.VITE_ML_API_BASE as string | undefined)?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }

  // Local dev keeps existing behavior, production falls back to same-origin.
  if (import.meta.env.DEV) {
    return "http://localhost:5000";
  }

  return window.location.origin;
}

// ============================================================
// GET /stocks  →  ticker list for the search autocomplete
// ============================================================
export async function getStockSymbols(market: string = "US"): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/stocks?market=${market}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.symbols as string[]) ?? [];
  } catch (err) {
    console.error("getStockSymbols failed:", err);
    return [];
  }
}

// ============================================================
// POST /predict  →  full ML portfolio analysis
// ============================================================
export async function predictPortfolio(
  portfolio: PortfolioAsset[],
  market: string = "US"
): Promise<PortfolioResult> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ portfolio, market }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? `HTTP ${res.status}`);
  }

  const data = await res.json();

  // ── Map every Flask field → PortfolioResult ────────────────────────────────
  //
  //  Transformations needed:
  //    risk_level        "Moderate Risk"  →  "Moderate"
  //    weight string     "69.6%"          →  0.696
  //    asset risk_level  "High Risk"      →  "High"
  //
  return {
    // ── Portfolio-level fields ───────────────────────────────────────────────
    liquidity_score:            data.liquidity_score,
    risk_level:                 stripRisk(data.risk_level),
    estimated_liquidation_time: data.liquidation_time,
    price_impact:               data.price_impact,
    most_illiquid_asset:        data.most_illiquid_asset,
    portfolio_value:            data.portfolio_value,
    model_used:                 data.model_used,
    total_positions:            data.total_positions,
    warnings:                   data.warnings ?? [],

    // ── Per-asset breakdown ──────────────────────────────────────────────────
    assets: (data.asset_breakdown ?? []).map((a: any) => ({
      symbol:           a.symbol,
      qty:              a.qty,
      close:            a.close,
      value:            a.position_value,
      weight:           parseWeight(a.weight),        // "69.6%" → 0.696
      liquidity_score:  a.liquidity_score,
      risk_level:       stripRisk(a.risk_level),      // "High Risk" → "High"
      liquidation_time: a.liquidation_time,
      avg_volume:       a.close ?? 0,
      // ML features
      spread_proxy:     a.spread_proxy,
      volatility:       a.volatility,
      amihud_ratio:     a.amihud_ratio,
    })),
  };
}

// ============================================================
// POST /explain  →  future predictions + AI explanation
// ============================================================
export async function explainPortfolio(
  portfolio: PortfolioAsset[],
  market: string = "US"
): Promise<any> {
  const res = await fetch(`${API_BASE}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ portfolio, market }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? `HTTP ${res.status}`);
  }

  return await res.json();
}

export async function explainSymbol(
  symbol: string,
  market: string = "US"
): Promise<any> {
  const res = await fetch(`${API_BASE}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, market }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? `HTTP ${res.status}`);
  }

  return await res.json();
}

// ============================================================
// POST /generate-liquidity-report  →  PDF report download
// ============================================================
export async function downloadLiquidityReport(payload: {
  user_name: string;
  market: string;
  portfolio_result: PortfolioResult;
  ai_insights?: any;
}): Promise<void> {
  let res = await fetch(`${API_BASE}/generate-liquidity-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // Some deployments may have strict trailing-slash routing.
  if (res.status === 404 || res.status === 405) {
    const retry = await fetch(`${API_BASE}/generate-liquidity-report/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (retry.ok) {
      res = retry;
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 405) {
      throw new Error("Report endpoint not available on the active backend. Restart Flask backend to load /generate-liquidity-report.");
    }
    throw new Error((err as any).error ?? `HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const fileName = extractFileName(res.headers.get("Content-Disposition"))
    || `liquidity_report_${payload.market.toLowerCase()}.pdf`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// "Moderate Risk" → "Moderate",  "Low Risk" → "Low",  "High Risk" → "High"
function stripRisk(label: string): string {
  return (label ?? "").replace(/\s*Risk$/i, "").trim();
}

// "69.6%" → 0.696,  already a number → pass through
function parseWeight(w: string | number): number {
  if (typeof w === "number") return w > 1 ? w / 100 : w;
  const n = parseFloat(w);
  return isNaN(n) ? 0 : n / 100;
}

function extractFileName(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;
  const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return match?.[1] ?? null;
}