"""
llm_reasoning.py — LangChain-powered Liquidity Explanation
===========================================================
Uses LangChain + LLM to generate natural language explanations
for liquidity predictions and market trends.

Functions:
  explain_liquidity_prediction() — Generate explanation for predictions
  analyze_liquidity_trend()      — Analyze trend direction and causes
  get_market_context()           — Extract recent market context
"""

import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

# LangChain imports
try:
    from langchain.prompts import PromptTemplate
    from langchain.chains import LLMChain
    from langchain_openai import ChatOpenAI
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    logging.warning("LangChain not installed. Install with: pip install langchain langchain-openai")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# US Market
FEATURES_PATH_US = os.path.join(BASE_DIR, "liquidity_features.csv")

# Indian Market
FEATURES_PATH_INDIA = os.path.join(BASE_DIR, "liquidity_features_india.csv")

# Legacy (default to US)
FEATURES_PATH = FEATURES_PATH_US


# ══════════════════════════════════════════════════════════════════════════════
# MARKET CONTEXT EXTRACTION
# ══════════════════════════════════════════════════════════════════════════════

def get_market_context(symbol, market="US", days_back=30):
    """
    Extract recent market context for a symbol.
    
    Parameters
    ----------
    symbol : str
        Stock ticker
    market : str
        "US" or "INDIA"
    days_back : int
        Number of days to analyze
    
    Returns
    -------
    dict
        Market context metrics
    """
    # Select features path based on market
    if market.upper() == "INDIA":
        features_path = FEATURES_PATH_INDIA
    else:
        features_path = FEATURES_PATH_US
    
    if not os.path.exists(features_path):
        log.warning(f"Features file not found: {features_path}")
        return None
    
    df = pd.read_csv(features_path, parse_dates=['date'])
    
    symbol_data = df[df['symbol'] == symbol.upper()].sort_values('date')
    
    if symbol_data.empty:
        return None
    
    # Get recent data
    recent = symbol_data.tail(days_back)
    
    if len(recent) < 2:
        return None
    
    # Calculate trends
    volume_trend = (recent['volume'].iloc[-1] - recent['volume'].mean()) / recent['volume'].mean() * 100
    spread_trend = (recent['spread_proxy'].iloc[-1] - recent['spread_proxy'].mean()) / recent['spread_proxy'].mean() * 100
    volatility_trend = (recent['volatility'].iloc[-1] - recent['volatility'].mean()) / recent['volatility'].mean() * 100
    liquidity_trend = recent['liquidity_score'].iloc[-1] - recent['liquidity_score'].iloc[0]
    
    context = {
        'symbol': symbol,
        'latest_date': str(recent['date'].iloc[-1]),
        'current_liquidity': float(recent['liquidity_score'].iloc[-1]),
        'liquidity_change_30d': float(liquidity_trend),
        'avg_volume': float(recent['volume'].mean()),
        'volume_trend_pct': float(volume_trend),
        'avg_spread': float(recent['spread_proxy'].mean()),
        'spread_trend_pct': float(spread_trend),
        'avg_volatility': float(recent['volatility'].mean()),
        'volatility_trend_pct': float(volatility_trend),
        'liquidity_direction': 'increasing' if liquidity_trend > 0 else 'decreasing',
        'volume_direction': 'increasing' if volume_trend > 0 else 'decreasing',
        'spread_direction': 'widening' if spread_trend > 0 else 'tightening',
        'volatility_direction': 'increasing' if volatility_trend > 0 else 'decreasing'
    }
    
    return context


# ══════════════════════════════════════════════════════════════════════════════
# LANGCHAIN LLM REASONING
# ══════════════════════════════════════════════════════════════════════════════

def explain_liquidity_prediction(prediction_data, market_context=None, use_llm=True):
    """
    Generate natural language explanation for liquidity predictions.
    
    Parameters
    ----------
    prediction_data : dict
        Prediction results from prediction_engine
    market_context : dict, optional
        Market context from get_market_context()
    use_llm : bool
        Whether to use LLM (requires API key) or rule-based fallback
    
    Returns
    -------
    str
        Natural language explanation
    """
    symbol = prediction_data.get('symbol', 'Portfolio')
    current_liq = prediction_data.get('current_liquidity', 0)
    
    # Extract predictions
    preds = prediction_data.get('predictions', {})
    t1 = preds.get('t_plus_1', {}).get('predicted_liquidity', current_liq)
    t3 = preds.get('t_plus_3', {}).get('predicted_liquidity', current_liq)
    t7 = preds.get('t_plus_7', {}).get('predicted_liquidity', current_liq)
    
    # Get market context if not provided
    if market_context is None and symbol != 'Portfolio':
        market_context = get_market_context(symbol)
    
    # Use LLM if available and requested
    if use_llm and LANGCHAIN_AVAILABLE and os.getenv('OPENAI_API_KEY'):
        return _generate_llm_explanation(
            symbol, current_liq, t1, t3, t7, market_context
        )
    else:
        # Fallback to rule-based explanation
        return _generate_rule_based_explanation(
            symbol, current_liq, t1, t3, t7, market_context
        )


def _generate_llm_explanation(symbol, current, t1, t3, t7, context):
    """Generate explanation using LangChain + LLM."""
    
    # Build context string
    context_str = ""
    if context:
        context_str = f"""
Recent Market Context (30-day):
- Trading volume is {context['volume_direction']} ({context['volume_trend_pct']:.1f}%)
- Bid-ask spread is {context['spread_direction']} ({context['spread_trend_pct']:.1f}%)
- Price volatility is {context['volatility_direction']} ({context['volatility_trend_pct']:.1f}%)
- Overall liquidity trend: {context['liquidity_direction']}
"""
    
    # Create prompt template
    template = """You are a financial analyst explaining stock liquidity predictions to investors.

Stock: {symbol}
Current Liquidity Score: {current:.4f} (0=illiquid, 1=highly liquid)

Predicted Liquidity:
- Tomorrow (t+1): {t1:.4f}
- In 3 days (t+3): {t3:.4f}
- In 7 days (t+7): {t7:.4f}

{context}

Provide a concise 2-3 sentence explanation of:
1. The predicted liquidity trend (improving/declining/stable)
2. The main factors driving this trend based on the market context
3. What this means for investors

Keep it professional but accessible. Focus on actionable insights."""
    
    prompt = PromptTemplate(
        input_variables=["symbol", "current", "t1", "t3", "t7", "context"],
        template=template
    )
    
    try:
        # Initialize LLM
        llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0.3,
            max_tokens=200
        )
        
        # Create chain
        chain = LLMChain(llm=llm, prompt=prompt)
        
        # Generate explanation
        result = chain.run(
            symbol=symbol,
            current=current,
            t1=t1,
            t3=t3,
            t7=t7,
            context=context_str
        )
        
        return result.strip()
        
    except Exception as e:
        log.error(f"LLM generation failed: {e}")
        return _generate_rule_based_explanation(symbol, current, t1, t3, t7, context)


def _generate_rule_based_explanation(symbol, current, t1, t3, t7, context):
    """Generate explanation using rule-based logic (fallback)."""
    
    # Determine trend
    trend_1d = t1 - current
    trend_7d = t7 - current
    
    if trend_7d > 0.05:
        trend_desc = "improving significantly"
        outlook = "positive"
    elif trend_7d > 0.01:
        trend_desc = "gradually improving"
        outlook = "moderately positive"
    elif trend_7d < -0.05:
        trend_desc = "declining significantly"
        outlook = "concerning"
    elif trend_7d < -0.01:
        trend_desc = "gradually declining"
        outlook = "moderately negative"
    else:
        trend_desc = "remaining stable"
        outlook = "neutral"
    
    # Build explanation
    explanation = f"Liquidity for {symbol} is {trend_desc} over the next week. "
    
    # Add context-based reasoning
    if context:
        factors = []
        
        if abs(context['volume_trend_pct']) > 10:
            direction = "increasing" if context['volume_trend_pct'] > 0 else "decreasing"
            factors.append(f"{direction} trading volume")
        
        if abs(context['volatility_trend_pct']) > 15:
            direction = "rising" if context['volatility_trend_pct'] > 0 else "falling"
            factors.append(f"{direction} price volatility")
        
        if abs(context['spread_trend_pct']) > 10:
            direction = "widening" if context['spread_trend_pct'] > 0 else "tightening"
            factors.append(f"{direction} bid-ask spreads")
        
        if factors:
            explanation += f"This trend is driven by {', '.join(factors)}. "
    
    # Add investor guidance
    if outlook == "positive":
        explanation += "Investors should find it easier to enter or exit positions with minimal price impact."
    elif outlook == "concerning":
        explanation += "Investors may face higher transaction costs and should consider timing their trades carefully."
    else:
        explanation += "Current market conditions suggest stable trading conditions."
    
    return explanation


def analyze_liquidity_trend(symbol, days_back=90):
    """
    Analyze long-term liquidity trend for a symbol.
    
    Parameters
    ----------
    symbol : str
        Stock ticker
    days_back : int
        Analysis period
    
    Returns
    -------
    dict
        Trend analysis with explanation
    """
    df = pd.read_csv(FEATURES_PATH, parse_dates=['date'])
    
    symbol_data = df[df['symbol'] == symbol.upper()].sort_values('date')
    
    if symbol_data.empty:
        return {'error': f'Symbol {symbol} not found'}
    
    recent = symbol_data.tail(days_back)
    
    if len(recent) < 10:
        return {'error': 'Insufficient data for trend analysis'}
    
    # Calculate trend metrics
    liq_scores = recent['liquidity_score'].values
    dates = recent['date'].values
    
    # Linear regression for trend
    x = np.arange(len(liq_scores))
    slope = np.polyfit(x, liq_scores, 1)[0]
    
    # Volatility of liquidity
    liq_volatility = np.std(liq_scores)
    
    # Recent vs historical average
    recent_avg = liq_scores[-30:].mean() if len(liq_scores) >= 30 else liq_scores[-10:].mean()
    historical_avg = liq_scores.mean()
    
    trend_direction = "upward" if slope > 0.0001 else "downward" if slope < -0.0001 else "stable"
    
    analysis = {
        'symbol': symbol,
        'period_days': len(recent),
        'current_liquidity': float(liq_scores[-1]),
        'average_liquidity': float(historical_avg),
        'recent_average': float(recent_avg),
        'trend_slope': float(slope),
        'trend_direction': trend_direction,
        'liquidity_volatility': float(liq_volatility),
        'stability': 'high' if liq_volatility < 0.05 else 'moderate' if liq_volatility < 0.1 else 'low'
    }
    
    # Generate summary
    if trend_direction == "upward":
        summary = f"{symbol} shows improving liquidity over the past {days_back} days, with recent levels above historical average."
    elif trend_direction == "downward":
        summary = f"{symbol} exhibits declining liquidity over the past {days_back} days, suggesting tightening market conditions."
    else:
        summary = f"{symbol} maintains stable liquidity over the past {days_back} days with consistent trading conditions."
    
    analysis['summary'] = summary
    
    return analysis


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("="*60)
    print("  LLM REASONING MODULE")
    print("="*60)
    
    # Test with sample data
    test_prediction = {
        'symbol': 'AAPL',
        'current_liquidity': 0.75,
        'predictions': {
            't_plus_1': {'predicted_liquidity': 0.73},
            't_plus_3': {'predicted_liquidity': 0.70},
            't_plus_7': {'predicted_liquidity': 0.68}
        }
    }
    
    print("\nGenerating explanation...")
    explanation = explain_liquidity_prediction(test_prediction, use_llm=False)
    print(f"\n{explanation}")
    
    print("\n" + "="*60)
    print("✅ LLM reasoning module ready")
    print("\nNote: Set OPENAI_API_KEY environment variable to use LLM features")
