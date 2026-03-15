import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  RadialBarChart, RadialBar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts";

// ══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════════════════════════════════
const API = axios.create({
  baseURL: "http://localhost:5000",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:       "#080809",
  surface:  "#0f0f12",
  surface2: "#141418",
  border:   "#1c1c22",
  border2:  "#252530",
  amber:    "#f5a623",
  amberLo:  "#3d2a0a",
  amberMid: "#7a5010",
  green:    "#22c55e",
  greenLo:  "#0a2818",
  red:      "#ef4444",
  redLo:    "#1f0808",
  yellow:   "#eab308",
  text:     "#e2e2ea",
  muted:    "#64647a",
  dim:      "#2e2e3a",
};

const mono = { fontFamily: "'Courier New', Courier, monospace" };
const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 3, padding: "20px 24px" };

const scoreColor = s => s >= 0.6 ? C.green : s >= 0.4 ? C.yellow : C.red;
const riskColor  = r => r?.includes("Low") ? C.green : r?.includes("Moderate") ? C.yellow : C.red;
const riskBg     = r => r?.includes("Low") ? C.greenLo : r?.includes("Moderate") ? "#1a1600" : C.redLo;

// ══════════════════════════════════════════════════════════════════════════════
// API STATUS BAR
// ══════════════════════════════════════════════════════════════════════════════
function ApiStatusBar({ status, modelInfo }) {
  const dot = status === "online"  ? C.green
            : status === "checking" ? C.yellow
            : C.red;
  const label = status === "online"  ? "API ONLINE"
              : status === "checking" ? "CONNECTING…"
              : "API OFFLINE";
  return (
    <div style={{
      ...mono, display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"7px 16px", background: C.surface2,
      borderBottom:`1px solid ${C.border}`, fontSize:9, letterSpacing:2,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{
          width:6, height:6, borderRadius:"50%", background:dot,
          boxShadow: status==="online" ? `0 0 6px ${C.green}` : "none",
          display:"inline-block",
          animation: status==="checking" ? "pulse 1s ease infinite" : "none",
        }}/>
        <span style={{ color: dot }}>{label}</span>
        {status !== "online" && (
          <span style={{ color:C.muted }}>— start Flask: <span style={{ color:C.amber }}>python app.py</span></span>
        )}
      </div>
      {modelInfo && (
        <div style={{ display:"flex", gap:16, color:C.muted }}>
          <span>MODEL: <span style={{ color:C.amber }}>{modelInfo.model}</span></span>
          <span>R²: <span style={{ color:C.text }}>{modelInfo.model_r2}</span></span>
          <span>SYMBOLS: <span style={{ color:C.text }}>{modelInfo.symbols_count}</span></span>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GAUGE
// ══════════════════════════════════════════════════════════════════════════════
function LiquidityGauge({ score }) {
  const pct   = Math.round((score || 0) * 100);
  const color = scoreColor(score || 0);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <div style={{ position:"relative", width:190, height:105 }}>
        {/* Track */}
        <RadialBarChart width={190} height={190} cx={95} cy={95}
          innerRadius={65} outerRadius={88} startAngle={180} endAngle={0}
          data={[{ value:100, fill:C.dim }]} barSize={14}>
          <RadialBar dataKey="value" cornerRadius={3} />
        </RadialBarChart>
        {/* Fill */}
        <div style={{ position:"absolute", top:0, left:0 }}>
          <RadialBarChart width={190} height={190} cx={95} cy={95}
            innerRadius={65} outerRadius={88}
            startAngle={180} endAngle={180 - pct * 1.8}
            data={[{ value:pct, fill:color }]} barSize={14}>
            <RadialBar dataKey="value" cornerRadius={3} />
          </RadialBarChart>
        </div>
        <div style={{ position:"absolute", top:46, left:0, width:"100%", textAlign:"center" }}>
          <span style={{ ...mono, fontSize:32, fontWeight:700, color, lineHeight:1 }}>{pct}</span>
          <span style={{ ...mono, fontSize:12, color:C.muted }}>/100</span>
        </div>
      </div>
      <span style={{ ...mono, fontSize:9, color:C.muted, letterSpacing:3 }}>LIQUIDITY INDEX</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CHARTS
// ══════════════════════════════════════════════════════════════════════════════
function AssetScoreChart({ breakdown }) {
  const data = (breakdown||[]).map(a => ({
    symbol: a.symbol, score: +(a.liquidity_score*100).toFixed(1), fill: scoreColor(a.liquidity_score),
  }));
  return (
    <ResponsiveContainer width="100%" height={175}>
      <BarChart data={data} margin={{ top:14, right:8, left:-22, bottom:0 }} barSize={Math.min(32, 200/data.length)}>
        <CartesianGrid vertical={false} stroke={C.border} strokeDasharray="2 5" />
        <XAxis dataKey="symbol" tick={{ fill:C.muted, fontSize:9, fontFamily:"Courier New" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0,100]} tick={{ fill:C.muted, fontSize:8, fontFamily:"Courier New" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:2, ...mono, fontSize:11 }}
          labelStyle={{ color:C.amber }} itemStyle={{ color:C.text }}
          formatter={v=>[`${v} / 100`, "Liquidity Score"]}
        />
        <Bar dataKey="score" radius={[2,2,0,0]}>
          {data.map((d,i)=><Cell key={i} fill={d.fill} opacity={0.8}/>)}
          <LabelList dataKey="score" position="top" style={{ fill:C.muted, fontSize:8, fontFamily:"Courier New" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function RiskDistChart({ breakdown }) {
  const buckets = {"Low Risk":0,"Moderate Risk":0,"High Risk":0};
  (breakdown||[]).forEach(a=>{ if(a.risk_level in buckets) buckets[a.risk_level]++; });
  const data = [
    { label:"LOW",  count:buckets["Low Risk"],      fill:C.green  },
    { label:"MOD",  count:buckets["Moderate Risk"], fill:C.yellow },
    { label:"HIGH", count:buckets["High Risk"],     fill:C.red    },
  ];
  return (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={data} layout="vertical" margin={{ top:0, right:32, left:0, bottom:0 }} barSize={16}>
        <CartesianGrid horizontal={false} stroke={C.border} strokeDasharray="2 5" />
        <XAxis type="number" tick={{ fill:C.muted, fontSize:8, fontFamily:"Courier New" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="label" tick={{ fill:C.muted, fontSize:9, fontFamily:"Courier New" }} axisLine={false} tickLine={false} width={34} />
        <Tooltip
          contentStyle={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:2, ...mono, fontSize:11 }}
          labelStyle={{ color:C.amber }} itemStyle={{ color:C.text }}
          formatter={v=>[v, "Positions"]}
        />
        <Bar dataKey="count" radius={[0,2,2,0]}>
          {data.map((d,i)=><Cell key={i} fill={d.fill} opacity={0.8}/>)}
          <LabelList dataKey="count" position="right" style={{ fill:C.text, fontSize:9, fontFamily:"Courier New" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function LiqTimeline({ breakdown }) {
  const sorted = [...(breakdown||[])].sort((a,b)=>b.liquidity_score - a.liquidity_score);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
      {sorted.map((a,i) => {
        const pct = Math.max(5, Math.round(a.liquidity_score * 100));
        return (
          <div key={a.symbol} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ ...mono, fontSize:10, color:C.amber, width:38, textAlign:"right", letterSpacing:1 }}>{a.symbol}</span>
            <div style={{ flex:1, background:C.dim, borderRadius:2, height:13, overflow:"hidden" }}>
              <div style={{
                width:`${pct}%`, height:"100%", borderRadius:2,
                background:`linear-gradient(90deg, ${scoreColor(a.liquidity_score)}cc, ${scoreColor(a.liquidity_score)}55)`,
                transition:"width 0.9s ease",
              }}/>
            </div>
            <span style={{ ...mono, fontSize:9, color:C.muted, width:62, textAlign:"right" }}>{a.liquidation_time}</span>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ══════════════════════════════════════════════════════════════════════════════
function StatCard({ label, value, color, sub, subColor }) {
  return (
    <div style={{ ...card, borderLeft:`3px solid ${color||C.amber}`, display:"flex", flexDirection:"column", gap:5 }}>
      <span style={{ ...mono, fontSize:8, color:C.muted, letterSpacing:3 }}>{label}</span>
      <span style={{ ...mono, fontSize:18, fontWeight:700, color:color||C.amber, lineHeight:1.1 }}>{value}</span>
      {sub && <span style={{ ...mono, fontSize:9, color:subColor||C.muted }}>{sub}</span>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LOADING OVERLAY
// ══════════════════════════════════════════════════════════════════════════════
function LoadingOverlay() {
  const [dots, setDots] = useState(".");
  useEffect(()=>{
    const t = setInterval(()=>setDots(d=>d.length>=3?".":d+"."),400);
    return ()=>clearInterval(t);
  },[]);
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(8,8,9,0.88)",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      zIndex:100, backdropFilter:"blur(4px)",
    }}>
      <div style={{ ...mono, textAlign:"center" }}>
        <div style={{ fontSize:32, color:C.amber, marginBottom:12 }}>◌</div>
        <div style={{ fontSize:12, color:C.text, letterSpacing:3 }}>ANALYZING PORTFOLIO{dots}</div>
        <div style={{ fontSize:9, color:C.muted, marginTop:8, letterSpacing:2 }}>ML MODEL COMPUTING LIQUIDITY METRICS</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INPUT PAGE
// ══════════════════════════════════════════════════════════════════════════════
function InputPage({ onSubmit, apiStatus, modelInfo }) {
  const [stocks,    setStocks]   = useState([]);
  const [symbols,   setSymbols]  = useState([]);
  const [query,     setQuery]    = useState("");
  const [qty,       setQty]      = useState("");
  const [selected,  setSelected] = useState("");
  const [loading,   setLoading]  = useState(false);
  const [error,     setError]    = useState("");
  const [apiError,  setApiError] = useState("");
  const inputRef = useRef(null);

  // Fetch symbol list from API
  useEffect(()=>{
    if (apiStatus !== "online") return;
    API.get("/stocks")
      .then(r => setSymbols(r.data.symbols || []))
      .catch(()=>{});
  }, [apiStatus]);

  const filtered = query.length >= 1
    ? symbols.filter(s=>s.startsWith(query.toUpperCase())).slice(0,8)
    : [];

  const addStock = () => {
    const sym = (selected || query).toUpperCase().trim();
    const q   = parseInt(qty);
    if (!sym)              { setError("Enter a stock symbol."); return; }
    if (!q || q <= 0)      { setError("Enter a valid quantity (> 0)."); return; }
    if (stocks.find(s=>s.symbol===sym)) { setError(`${sym} is already in the portfolio.`); return; }
    setStocks(p=>[...p, { symbol:sym, qty:q }]);
    setQuery(""); setQty(""); setSelected(""); setError("");
    inputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (stocks.length === 0) { setError("Add at least one position."); return; }
    setLoading(true); setApiError("");
    try {
      const res = await API.post("/predict", { portfolio: stocks });
      onSubmit(res.data, stocks);
    } catch (e) {
      const msg = e.response?.data?.error || e.message || "Unknown error";
      setApiError(`API error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <LoadingOverlay />}
      <div style={{ minHeight:"100vh", background:C.bg, ...mono }}>
        <ApiStatusBar status={apiStatus} modelInfo={modelInfo} />

        <div style={{ maxWidth:680, margin:"0 auto", padding:"44px 24px" }}>

          {/* Header */}
          <div style={{ marginBottom:36 }}>
            <div style={{ fontSize:9, color:C.amberMid, letterSpacing:5, marginBottom:8 }}>
              TERMINAL · FINANCIAL RISK ANALYTICS
            </div>
            <h1 style={{ margin:0, fontSize:26, fontWeight:700, color:C.text, lineHeight:1.2 }}>
              PORTFOLIO LIQUIDITY<br/>
              <span style={{ color:C.amber }}>PREDICTION SYSTEM</span>
            </h1>
            <div style={{ marginTop:10, fontSize:10, color:C.muted, letterSpacing:1 }}>
              ML-POWERED · GRADIENT BOOSTING · S&P 500 DATASET 2014–2017
            </div>
          </div>

          {/* API offline warning */}
          {apiStatus === "offline" && (
            <div style={{
              ...card, marginBottom:20,
              background:C.redLo, borderColor:`${C.red}44`, borderLeft:`3px solid ${C.red}`,
            }}>
              <div style={{ fontSize:9, color:C.red, letterSpacing:2, marginBottom:6 }}>⚠ BACKEND OFFLINE</div>
              <div style={{ fontSize:10, color:"#fca5a5" }}>
                Start the Flask server to enable live predictions:
              </div>
              <div style={{
                marginTop:8, padding:"6px 10px", background:"rgba(0,0,0,0.4)",
                fontSize:10, color:C.amber, borderRadius:2, letterSpacing:1,
              }}>
                $ python app.py
              </div>
              <div style={{ fontSize:9, color:C.muted, marginTop:6 }}>
                Demo mode: results will use simulated data.
              </div>
            </div>
          )}

          {/* ADD POSITION */}
          <div style={{ ...card, marginBottom:16 }}>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:3, marginBottom:14 }}>
              ADD POSITION
            </div>
            <div style={{ display:"flex", gap:10, position:"relative" }}>
              {/* Symbol search */}
              <div style={{ flex:2, position:"relative" }}>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e=>{ setQuery(e.target.value.toUpperCase()); setSelected(""); }}
                  placeholder="SYMBOL (e.g. AAPL)"
                  style={{
                    width:"100%", boxSizing:"border-box",
                    background:C.bg, border:`1px solid ${C.border2}`,
                    color:C.text, padding:"10px 14px", fontSize:12, ...mono,
                    borderRadius:2, outline:"none", letterSpacing:2,
                    transition:"border-color 0.15s",
                  }}
                  onFocus={e=>e.target.style.borderColor=C.amber}
                  onBlur={e=>setTimeout(()=>e.target.style.borderColor=C.border2,150)}
                  onKeyDown={e=>e.key==="Enter"&&addStock()}
                />
                {filtered.length > 0 && (
                  <div style={{
                    position:"absolute", top:"100%", left:0, right:0, zIndex:20,
                    background:C.surface2, border:`1px solid ${C.border2}`, borderTop:"none",
                    maxHeight:220, overflowY:"auto", borderRadius:"0 0 2px 2px",
                  }}>
                    {filtered.map(sym=>(
                      <div key={sym}
                        onMouseDown={()=>{ setSelected(sym); setQuery(sym); }}
                        style={{
                          padding:"9px 14px", fontSize:11, cursor:"pointer",
                          color:C.text, letterSpacing:2, borderBottom:`1px solid ${C.border}`,
                          transition:"background 0.1s",
                        }}
                        onMouseEnter={e=>e.currentTarget.style.background=C.dim}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                      >{sym}</div>
                    ))}
                  </div>
                )}
              </div>
              {/* Qty */}
              <input
                value={qty}
                type="number" min="1"
                onChange={e=>setQty(e.target.value)}
                placeholder="SHARES"
                style={{
                  flex:1, background:C.bg, border:`1px solid ${C.border2}`,
                  color:C.text, padding:"10px 14px", fontSize:12, ...mono,
                  borderRadius:2, outline:"none", boxSizing:"border-box",
                }}
                onFocus={e=>e.target.style.borderColor=C.amber}
                onBlur={e=>e.target.style.borderColor=C.border2}
                onKeyDown={e=>e.key==="Enter"&&addStock()}
              />
              <button onClick={addStock} style={{
                background:C.amber, color:C.bg, border:"none",
                padding:"10px 20px", fontSize:10, ...mono, fontWeight:700,
                letterSpacing:2, cursor:"pointer", borderRadius:2, whiteSpace:"nowrap",
                transition:"opacity 0.15s",
              }}
                onMouseEnter={e=>e.target.style.opacity=0.8}
                onMouseLeave={e=>e.target.style.opacity=1}
              >+ ADD</button>
            </div>
            {error && <div style={{ marginTop:10, fontSize:9, color:C.red, letterSpacing:1 }}>⚠ {error}</div>}
          </div>

          {/* PORTFOLIO TABLE */}
          {stocks.length > 0 && (
            <div style={{ ...card, marginBottom:16 }}>
              <div style={{
                display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14,
              }}>
                <span style={{ fontSize:9, color:C.muted, letterSpacing:3 }}>
                  PORTFOLIO · {stocks.length} POSITION{stocks.length>1?"S":""}
                </span>
                <button onClick={()=>setStocks([])} style={{
                  background:"none", border:`1px solid ${C.border2}`, color:C.muted,
                  padding:"3px 10px", fontSize:8, ...mono, cursor:"pointer", letterSpacing:2, borderRadius:2,
                }}
                  onMouseEnter={e=>{e.target.style.borderColor=C.red;e.target.style.color=C.red;}}
                  onMouseLeave={e=>{e.target.style.borderColor=C.border2;e.target.style.color=C.muted;}}
                >CLEAR ALL</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 90px 70px", padding:"0 0 8px", borderBottom:`1px solid ${C.border2}`, marginBottom:4 }}>
                {["SYMBOL","SHARES",""].map(h=>(
                  <span key={h} style={{ fontSize:8, color:C.dim, letterSpacing:2 }}>{h}</span>
                ))}
              </div>
              {stocks.map((s,i)=>(
                <div key={s.symbol} style={{
                  display:"grid", gridTemplateColumns:"1fr 90px 70px",
                  padding:"9px 0", borderBottom:`1px solid ${C.border}`,
                  alignItems:"center",
                  animation:`slideIn 0.2s ease ${i*0.04}s both`,
                }}>
                  <span style={{ fontSize:13, color:C.amber, letterSpacing:2 }}>{s.symbol}</span>
                  <span style={{ fontSize:12, color:C.text }}>{s.qty.toLocaleString()}</span>
                  <div style={{ textAlign:"right" }}>
                    <button onClick={()=>setStocks(p=>p.filter(x=>x.symbol!==s.symbol))} style={{
                      background:"none", border:`1px solid ${C.border2}`, color:C.muted,
                      fontSize:8, padding:"3px 8px", cursor:"pointer", ...mono, borderRadius:1,
                      transition:"all 0.1s",
                    }}
                      onMouseEnter={e=>{e.target.style.borderColor=C.red;e.target.style.color=C.red;}}
                      onMouseLeave={e=>{e.target.style.borderColor=C.border2;e.target.style.color=C.muted;}}
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* API ERROR */}
          {apiError && (
            <div style={{
              ...card, marginBottom:16,
              background:C.redLo, borderColor:`${C.red}44`, borderLeft:`3px solid ${C.red}`,
            }}>
              <span style={{ fontSize:10, color:"#fca5a5" }}>{apiError}</span>
            </div>
          )}

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            disabled={loading || stocks.length===0}
            style={{
              width:"100%", background:stocks.length===0?C.dim:C.amber,
              color:stocks.length===0?C.muted:C.bg, border:"none",
              padding:"14px 0", fontSize:11, ...mono, fontWeight:700,
              letterSpacing:3, cursor:stocks.length===0?"not-allowed":"pointer",
              borderRadius:2, transition:"all 0.2s",
            }}
            onMouseEnter={e=>{ if(stocks.length>0) e.target.style.opacity=0.85; }}
            onMouseLeave={e=>e.target.style.opacity=1}
          >
            {loading ? "◌  ANALYZING…" : "▶  RUN LIQUIDITY ANALYSIS"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.3} }
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:${C.bg}}
        ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:2px}
      `}</style>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RESULTS PAGE
// ══════════════════════════════════════════════════════════════════════════════
function ResultsPage({ result, portfolio, onReset, apiStatus, modelInfo }) {
  const [show, setShow] = useState(false);
  useEffect(()=>{ setTimeout(()=>setShow(true), 60); },[]);

  const score = result.liquidity_score || 0;
  const bd    = result.asset_breakdown  || [];
  const piVal = parseFloat(result.price_impact) || 0;

  return (
    <div style={{
      minHeight:"100vh", background:C.bg, ...mono,
      opacity: show?1:0, transition:"opacity 0.4s ease",
    }}>
      <ApiStatusBar status={apiStatus} modelInfo={modelInfo} />

      <div style={{ maxWidth:1020, margin:"0 auto", padding:"32px 24px" }}>

        {/* Top bar */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div>
            <div style={{ fontSize:9, color:C.amberMid, letterSpacing:4, marginBottom:5 }}>
              ANALYSIS COMPLETE · {new Date().toLocaleTimeString()}
            </div>
            <h2 style={{ margin:0, fontSize:22, color:C.text, fontWeight:700, letterSpacing:-0.3 }}>
              LIQUIDITY REPORT
              <span style={{ color:C.amber }}> /</span>
              <span style={{ fontSize:13, color:C.muted, fontWeight:400 }}>
                {" "}{portfolio.length} position{portfolio.length>1?"s":""}
                {" · "}{result.portfolio_value}
              </span>
            </h2>
          </div>
          <button onClick={onReset} style={{
            background:"none", border:`1px solid ${C.border2}`, color:C.muted,
            padding:"8px 16px", fontSize:9, ...mono, cursor:"pointer", letterSpacing:2, borderRadius:2,
            transition:"all 0.15s",
          }}
            onMouseEnter={e=>{e.target.style.borderColor=C.amber;e.target.style.color=C.amber;}}
            onMouseLeave={e=>{e.target.style.borderColor=C.border2;e.target.style.color=C.muted;}}
          >← NEW ANALYSIS</button>
        </div>

        {/* GAUGE + STATS ROW */}
        <div style={{ display:"grid", gridTemplateColumns:"210px 1fr", gap:14, marginBottom:14 }}>
          <div style={{
            ...card, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:14,
          }}>
            <LiquidityGauge score={score} />
            <div style={{
              background: riskBg(result.risk_level),
              border:`1px solid ${riskColor(result.risk_level)}44`,
              padding:"5px 14px", borderRadius:2,
            }}>
              <span style={{ fontSize:9, color:riskColor(result.risk_level), letterSpacing:3 }}>
                {result.risk_level?.toUpperCase()}
              </span>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gridTemplateRows:"1fr 1fr", gap:10 }}>
            <StatCard label="PORTFOLIO VALUE"     value={result.portfolio_value}     color={C.amber} />
            <StatCard label="LIQUIDATION TIME"    value={result.liquidation_time}    color={C.text}
              sub="AT HISTORICAL DAILY VOLUME" />
            <StatCard label="EXPECTED PRICE IMPACT" value={result.price_impact}
              color={piVal > 5 ? C.red : C.green}
              sub={piVal > 5 ? "⚠ HIGH — MAY MOVE MARKET" : "✓ WITHIN NORMAL RANGE"}
              subColor={piVal > 5 ? C.red : C.green}
            />
            <StatCard label="MOST ILLIQUID ASSET" value={result.most_illiquid_asset} color={C.red}
              sub="HARDEST TO LIQUIDATE QUICKLY" />
          </div>
        </div>

        {/* CHARTS ROW */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>

          {/* Asset scores */}
          <div style={{ ...card }}>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:3, marginBottom:12 }}>
              ASSET LIQUIDITY SCORES
            </div>
            <AssetScoreChart breakdown={bd} />
            <div style={{ display:"flex", gap:14, marginTop:8 }}>
              {[[C.green,"≥60 LIQUID"],[C.yellow,"40–60 MOD"],[C.red,"<40 ILLIQUID"]].map(([c,l])=>(
                <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:7, height:7, background:c, borderRadius:1 }}/>
                  <span style={{ fontSize:8, color:C.muted, letterSpacing:1 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk distribution + model info */}
          <div style={{ ...card }}>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:3, marginBottom:12 }}>
              RISK DISTRIBUTION
            </div>
            <RiskDistChart breakdown={bd} />
            <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:8, color:C.dim, letterSpacing:2, marginBottom:6 }}>MODEL METADATA</div>
              <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                <span style={{ fontSize:9 }}>
                  <span style={{ color:C.muted }}>ALGO  </span>
                  <span style={{ color:C.amber }}>{result.model_used}</span>
                </span>
                <span style={{ fontSize:9 }}>
                  <span style={{ color:C.muted }}>POSITIONS  </span>
                  <span style={{ color:C.text }}>{result.total_positions}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LIQUIDATION TIMELINE */}
        <div style={{ ...card, marginBottom:14 }}>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:3, marginBottom:14 }}>
            LIQUIDATION EASE BY ASSET
          </div>
          <LiqTimeline breakdown={bd} />
        </div>

        {/* POSITION TABLE */}
        <div style={{ ...card, marginBottom:14 }}>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:3, marginBottom:14 }}>
            FULL POSITION BREAKDOWN
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${C.border2}` }}>
                  {["SYMBOL","SHARES","CLOSE","VALUE","WEIGHT","SCORE","RISK","LIQ. TIME"].map(h=>(
                    <th key={h} style={{
                      padding:"5px 10px", textAlign:"left",
                      fontSize:8, color:C.dim, letterSpacing:2, fontWeight:400,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bd.map((a,i)=>(
                  <tr key={a.symbol} style={{
                    borderBottom:`1px solid ${C.border}`,
                    opacity:0, animation:`fadeUp 0.3s ease ${i*0.07}s forwards`,
                  }}>
                    <td style={{ padding:"10px", color:C.amber, letterSpacing:2 }}>{a.symbol}</td>
                    <td style={{ padding:"10px", color:C.text }}>{(a.qty||0).toLocaleString()}</td>
                    <td style={{ padding:"10px", color:C.muted }}>${(a.close||0).toFixed(2)}</td>
                    <td style={{ padding:"10px", color:C.text }}>
                      ${(a.position_value||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}
                    </td>
                    <td style={{ padding:"10px", color:C.muted }}>{a.weight}</td>
                    <td style={{ padding:"10px" }}>
                      <span style={{ color:scoreColor(a.liquidity_score), fontWeight:700 }}>
                        {((a.liquidity_score||0)*100).toFixed(1)}
                      </span>
                    </td>
                    <td style={{ padding:"10px" }}>
                      <span style={{
                        color:riskColor(a.risk_level), fontSize:8, letterSpacing:1,
                        border:`1px solid ${riskColor(a.risk_level)}44`,
                        background:riskBg(a.risk_level),
                        padding:"2px 7px", borderRadius:2,
                      }}>
                        {a.risk_level?.replace(" Risk","").toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding:"10px", color:C.muted, fontSize:10 }}>{a.liquidation_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* WARNINGS */}
        {result.warnings?.length > 0 && (
          <div style={{
            ...card,
            background:C.redLo, borderColor:`${C.red}33`, borderLeft:`3px solid ${C.red}`,
          }}>
            <div style={{ fontSize:9, color:C.red, letterSpacing:3, marginBottom:8 }}>⚠ RISK WARNINGS</div>
            {result.warnings.map((w,i)=>(
              <div key={i} style={{ fontSize:10, color:"#fca5a5", marginBottom:5, lineHeight:1.5 }}>
                · {w}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:${C.bg}}
        ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:2px}
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT — API polling + routing
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [result,    setResult]    = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [apiStatus, setApiStatus] = useState("checking");
  const [modelInfo, setModelInfo] = useState(null);

  // Poll /health every 8 seconds
  const checkApi = useCallback(async () => {
    try {
      const r = await API.get("/health");
      setApiStatus("online");
      setModelInfo(r.data);
    } catch {
      setApiStatus("offline");
      setModelInfo(null);
    }
  }, []);

  useEffect(() => {
    checkApi();
    const interval = setInterval(checkApi, 8000);
    return () => clearInterval(interval);
  }, [checkApi]);

  const handleSubmit = (res, port) => {
    setResult(res);
    setPortfolio(port);
  };

  const sharedProps = { apiStatus, modelInfo };

  return result
    ? <ResultsPage result={result} portfolio={portfolio} onReset={()=>setResult(null)} {...sharedProps} />
    : <InputPage   onSubmit={handleSubmit} {...sharedProps} />;
}