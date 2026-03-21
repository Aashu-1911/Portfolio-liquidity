import type { PortfolioAsset, PortfolioResult } from "./types";

// ── Flask API base URL ─────────────────────────────────────────────────────────
const API_BASE = resolveApiBase();
const DEFAULT_HEADERS = { "Content-Type": "application/json" };
const STOCKS_TIMEOUT_MS = 20000;
const READ_TIMEOUT_MS = 60000;
const WRITE_TIMEOUT_MS = 90000;
const RETRY_DELAY_MS = 1200;

if (typeof window !== "undefined") {
  console.info("[ML API] Base URL:", API_BASE);
}

function resolveApiBase(): string {
  const fromEnv = (import.meta.env.VITE_ML_API_BASE as string | undefined)?.trim();
  if (fromEnv) {
    return sanitizeMlBase(fromEnv);
  }

  // Local dev keeps existing behavior, production uses hosted ML fallback.
  if (import.meta.env.DEV) {
    return "http://localhost:5000";
  }

  return sanitizeMlBase("https://liquidity-api-s804.onrender.com");
}

function sanitizeMlBase(value: string): string {
  const cleaned = (value || "").trim().replace(/\/+$/, "");
  if (!cleaned) return "https://liquidity-api-s804.onrender.com";

  // Flask ML endpoints live at root: /stocks, /predict, /explain.
  if (cleaned.toLowerCase().endsWith("/api")) {
    return cleaned.slice(0, -4);
  }

  return cleaned;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function isRetriableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function isRetriableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return error.name === "AbortError" || msg.includes("network") || msg.includes("failed to fetch");
}

async function parseJsonResponse<T>(res: Response, url: string): Promise<T> {
  const contentType = (res.headers.get("Content-Type") || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    const text = await res.text().catch(() => "");
    const sample = text.slice(0, 140).replace(/\s+/g, " ").trim();
    throw new Error(`Expected JSON from ${url} but received non-JSON response: ${sample || "<empty>"}`);
  }

  return (await res.json()) as T;
}

async function parseErrorResponse(res: Response): Promise<string> {
  const contentType = (res.headers.get("Content-Type") || "").toLowerCase();
  if (contentType.includes("application/json")) {
    const data = await res.json().catch(() => ({}));
    return (data as any).error || (data as any).message || `HTTP ${res.status}`;
  }

  const text = await res.text().catch(() => "");
  const sample = text.slice(0, 140).replace(/\s+/g, " ").trim();
  return sample ? `HTTP ${res.status} - ${sample}` : `HTTP ${res.status}`;
}

async function fetchJson<T>(url: string, init: RequestInit = {}, timeoutMs: number): Promise<T> {
  const res = await fetchWithTimeout(url, init, timeoutMs);
  if (!res.ok) {
    throw new Error(await parseErrorResponse(res));
  }
  return parseJsonResponse<T>(res, url);
}

async function fetchJsonWithRetry<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs: number,
  retries: number
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchJson<T>(url, init, timeoutMs);
    } catch (error) {
      lastError = error;
      const status = Number((error as Error)?.message?.match(/HTTP\s+(\d{3})/)?.[1]);
      const canRetry = attempt < retries && (isRetriableError(error) || (Number.isFinite(status) && isRetriableStatus(status)));
      if (!canRetry) {
        throw error;
      }
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown fetch failure");
}

const SYMBOL_CACHE_PREFIX = "liquidity_symbols_v1_";
const SYMBOL_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type SymbolCacheEntry = {
  symbols: string[];
  updatedAt: number;
};

function getSymbolCacheKey(market: string): string {
  return `${SYMBOL_CACHE_PREFIX}${market.toUpperCase()}`;
}

function readSymbolCache(market: string): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(getSymbolCacheKey(market));
    if (!raw) return [];

    const parsed = JSON.parse(raw) as SymbolCacheEntry;
    if (!Array.isArray(parsed?.symbols)) return [];

    const age = Date.now() - Number(parsed.updatedAt || 0);
    if (age > SYMBOL_CACHE_TTL_MS) return [];

    return parsed.symbols
      .map((s) => String(s).trim().toUpperCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function writeSymbolCache(market: string, symbols: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const unique = Array.from(new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean)));
    const payload: SymbolCacheEntry = {
      symbols: unique,
      updatedAt: Date.now(),
    };
    localStorage.setItem(getSymbolCacheKey(market), JSON.stringify(payload));
  } catch {
    // Ignore storage failures (e.g. private mode quota).
  }
}

export function getCachedStockSymbols(market: string = "US"): string[] {
  return readSymbolCache(market);
}

// ============================================================
// GET /stocks  →  ticker list for the search autocomplete
// ============================================================
export async function getStockSymbols(market: string = "US", forceRefresh: boolean = false): Promise<string[]> {
  if (!forceRefresh) {
    const cached = readSymbolCache(market);
    if (cached.length) return cached;
  }

  try {
    const data = await fetchJsonWithRetry<{ symbols?: string[] }>(
      `${API_BASE}/stocks?market=${encodeURIComponent(market)}`,
      {},
      STOCKS_TIMEOUT_MS,
      2
    );
    const symbols = (data.symbols as string[]) ?? [];
    if (symbols.length) {
      writeSymbolCache(market, symbols);
    }
    return symbols;
  } catch (err) {
    console.error("getStockSymbols failed:", err);
    return readSymbolCache(market);
  }
}

export async function getLiveQuotes(
  symbols: string[],
  market: string = "US"
): Promise<Record<string, number>> {
  const cleaned = Array.from(new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean)));
  if (!cleaned.length) return {};

  const data = await fetchJsonWithRetry<{ quotes?: Record<string, number> }>(
    `${API_BASE}/quotes?market=${encodeURIComponent(market)}&symbols=${encodeURIComponent(cleaned.join(","))}`,
    {},
    READ_TIMEOUT_MS,
    1
  );
  return (data.quotes as Record<string, number>) ?? {};
}

export async function getPriceHistory(
  symbols: string[],
  range: "1D" | "5D" | "1M" | "3M" | "1Y",
  market: string = "US"
): Promise<Record<string, any[]>> {
  const cleaned = Array.from(new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean)));
  if (!cleaned.length) return {};

  const data = await fetchJsonWithRetry<{ history?: Record<string, any[]> }>(
    `${API_BASE}/price-history?market=${encodeURIComponent(market)}&range=${encodeURIComponent(range)}&symbols=${encodeURIComponent(cleaned.join(","))}`,
    {},
    READ_TIMEOUT_MS,
    1
  );
  return (data.history as Record<string, any[]>) ?? {};
}

// ============================================================
// POST /predict  →  full ML portfolio analysis
// ============================================================
export async function predictPortfolio(
  portfolio: PortfolioAsset[],
  market: string = "US"
): Promise<PortfolioResult> {
  const symbols = portfolio.map((p) => p.symbol);
  let quotes: Record<string, number> = {};
  try {
    quotes = await getLiveQuotes(symbols, market);
  } catch {
    quotes = {};
  }

  const payloadPortfolio = portfolio.map((p) => ({
    ...p,
    price: quotes[p.symbol.toUpperCase()] ?? p.price,
  }));

  const data = await fetchJsonWithRetry<any>(
    `${API_BASE}/predict`,
    {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ portfolio: payloadPortfolio, market }),
    },
    WRITE_TIMEOUT_MS,
    1
  );

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
    portfolio_value:            normalizeMoneyDisplay(data.portfolio_value, market),
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

function normalizeMoneyDisplay(value: string, market: string): string {
  const symbol = market.toUpperCase() === "INDIA" ? "₹" : "$";
  if (!value) return `${symbol}0.00`;

  const num = Number(String(value).replace(/[₹$,\s]/g, "").replace(/,/g, ""));
  if (!Number.isFinite(num)) return String(value);

  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ============================================================
// POST /explain  →  future predictions + AI explanation
// ============================================================
export async function explainPortfolio(
  portfolio: PortfolioAsset[],
  market: string = "US"
): Promise<any> {
  return fetchJsonWithRetry<any>(
    `${API_BASE}/explain`,
    {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ portfolio, market }),
    },
    WRITE_TIMEOUT_MS,
    1
  );
}

export async function explainSymbol(
  symbol: string,
  market: string = "US"
): Promise<any> {
  return fetchJsonWithRetry<any>(
    `${API_BASE}/explain`,
    {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ symbol, market }),
    },
    WRITE_TIMEOUT_MS,
    1
  );
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
  let res = await fetchWithTimeout(`${API_BASE}/generate-liquidity-report`, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  }, WRITE_TIMEOUT_MS);

  // Some deployments may have strict trailing-slash routing.
  if (res.status === 404 || res.status === 405) {
    const retry = await fetchWithTimeout(`${API_BASE}/generate-liquidity-report/`, {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(payload),
    }, WRITE_TIMEOUT_MS);
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