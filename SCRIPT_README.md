# SCRIPT README - Portfolio Liquidity Prediction System

## 1. Project Title
Portfolio Liquidity Prediction System (Dual Market: US + India)

## 2. Executive Summary
This project is an AI and machine learning based liquidity intelligence platform that helps investors and analysts understand how easily a portfolio can be liquidated without heavy market impact.

The system combines:
- Data ingestion from market sources
- Feature engineering for liquidity microstructure signals
- ML models for current liquidity scoring
- Forecast models for near-term liquidity movement
- AI reasoning for natural-language interpretation
- Interactive web dashboard for decision support

It supports two markets:
- US market (S&P 500 universe)
- Indian market (NIFTY universe)

## 3. Problem Statement
In real-world portfolio management, users often know expected returns and volatility, but they do not have a direct and practical estimate of liquidity risk.

Key pain points this project solves:
- How quickly can positions be exited in stressed conditions?
- What slippage or price impact may occur during liquidation?
- Which position is the liquidity bottleneck in a portfolio?
- Is liquidity likely to improve or deteriorate over the next few days?
- How can users compare liquidity risk across US and Indian markets in one framework?

Traditional dashboards focus on price and returns. This system focuses on execution quality and liquidation risk, which is critical during volatility spikes and urgent rebalancing.

## 4. Core Objective
Build an end-to-end platform that can:
1. Quantify current portfolio liquidity using market microstructure proxies.
2. Forecast short-term liquidity (t+1, t+3, t+7 days).
3. Explain forecasts in readable language for faster decision-making.
4. Provide a dual-market experience for US and India.

## 5. How the Project Works (End-to-End)
The project follows a complete data-to-decision pipeline:

1. Data Collection
- Fetches historical and latest market data.
- Maintains market-specific datasets for US and India.

2. Data Processing
- Cleans and standardizes data.
- Handles missing values and aligns schema.

3. Feature Engineering
- Computes liquidity-related features such as:
  - volume
  - spread_proxy
  - volatility
  - amihud_ratio
- Builds a target liquidity score used for modeling.

4. Model Training
- Trains current-liquidity model (Gradient Boosting family).
- Trains future forecasting models for 1-day, 3-day, and 7-day horizons.
- Stores model artifacts for fast API serving.

5. Prediction Layer
- Accepts portfolio holdings from user.
- Predicts position-level and portfolio-level liquidity score.
- Returns risk tags, estimated liquidation time, and impact indicators.

6. Explanation Layer
- Uses rule-based reasoning and optional LLM workflow.
- Generates plain-language interpretation of forecast direction and drivers.

7. Delivery Layer
- Flask backend APIs serve analysis and report generation.
- React frontend visualizes current and future liquidity insights.

## 6. What Makes This Project Different
This project stands out through:
- Dual-market design: one platform for both US and India.
- Liquidity-first intelligence: not only returns or volatility.
- Forecast + explanation pairing: quantitative output plus readable reasoning.
- Portfolio-level utility: handles basket analysis, not only single symbols.
- Operational scripts: startup, setup, testing, and scheduling support.

## 7. Detailed Feature Breakdown and Use Cases

### 7.1 Portfolio Liquidity Scoring
What it does:
- Computes an aggregate liquidity score in range 0 to 1.

Use cases:
- Decide if a proposed portfolio is execution-friendly.
- Compare two portfolio allocations before rebalancing.
- Detect hidden exit risk in concentrated positions.

### 7.2 Risk Classification
What it does:
- Maps score into risk labels such as Low, Moderate, High, Very High.

Use cases:
- Risk committee review.
- Internal alerts for portfolios crossing liquidity thresholds.

### 7.3 Estimated Liquidation Time
What it does:
- Estimates approximate time to exit portfolio based on model features.

Use cases:
- Plan staged exits.
- Prepare emergency de-risking playbooks.

### 7.4 Price Impact Estimation
What it does:
- Provides expected impact/slippage proxy for liquidation.

Use cases:
- Improve execution strategy.
- Avoid forced liquidation under adverse market conditions.

### 7.5 Future Liquidity Forecasting (t+1, t+3, t+7)
What it does:
- Predicts near-term liquidity trajectory for assets and portfolios.

Use cases:
- Choose better trade timing windows.
- Delay or accelerate rebalance based on expected liquidity trend.

### 7.6 AI Explanation Layer
What it does:
- Produces plain-language rationale around forecast trend and likely drivers.
- Uses optional LLM mode when API key is available; otherwise rule-based fallback.

Use cases:
- Faster interpretation by non-quant users.
- Better communication for PMs, traders, and stakeholders.

### 7.7 Dual-Market Support (US and India)
What it does:
- Supports separate datasets and models with market-specific routes/workflows.

Use cases:
- Teams operating across geographies.
- Comparing liquidity characteristics between markets.

### 7.8 API-First Backend
What it does:
- Exposes production-friendly endpoints for health, symbols, prediction, explanation, and report generation.

Use cases:
- Integrate into external dashboards.
- Automate reporting from external systems.

### 7.9 Interactive Frontend Dashboard
What it does:
- Lets users build portfolios, run analysis, and inspect charts/cards for liquidity status and forecast.

Use cases:
- Analyst daily workflow.
- Hackathon/live demo setup.

### 7.10 Automated Pipeline/Scheduler
What it does:
- Supports one-time setup, manual run, scheduled updates, and daemon-like refresh workflows.

Use cases:
- Keep models updated with newer market data.
- Reduce manual operations effort.

## 8. Output Specification (What User Gets)

### 8.1 Current Liquidity Output
Typical output includes:
- liquidity_score (0 to 1)
- risk_level
- estimated_liquidation_time
- price_impact
- portfolio_value
- asset breakdown
- warnings for invalid symbols or weak liquidity positions

### 8.2 Forecast Output
Typical output includes:
- current_liquidity
- predicted_liquidity_tomorrow
- predicted_liquidity_3_days
- predicted_liquidity_7_days
- trend context metrics (volume, spread, volatility changes)

### 8.3 Explanation Output
Typical output includes:
- Human-readable summary of trend
- Key drivers likely impacting liquidity
- Practical action-oriented interpretation

### 8.4 Report Output
The backend includes report-generation flow for liquidity analysis output (structured export suitable for sharing and review workflows).

## 9. API Endpoints
Backend base: http://localhost:5000

1. GET /health
- Returns API status, selected model details, and symbol coverage.

2. GET /stocks
- Returns available symbols for selected market.

3. POST /predict
- Input: portfolio positions and market
- Output: current portfolio liquidity analysis

4. POST /explain
- Input: portfolio or symbol and market
- Output: future predictions plus explanation

5. POST /generate-liquidity-report
- Input: analysis payload
- Output: generated liquidity report document

## 10. Tech Stack

Backend:
- Python
- Flask
- scikit-learn
- pandas, numpy
- yfinance data ingestion
- Optional LangChain/LLM integration

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS
- Chart components for visual analytics

Modeling:
- Gradient Boosting style regressors
- Multi-horizon forecasting models

## 11. High-Level Architecture

1. Data Layer
- Historical and latest market data files
- Processed and feature CSV artifacts

2. Model Layer
- Current liquidity model files
- Forecast model files

3. Service Layer
- Prediction engine
- Explanation engine
- Pipeline scheduler

4. API Layer
- Flask routes for analysis and reporting

5. Presentation Layer
- React UI for portfolio entry and results visualization

## 12. Main Project Components

Backend core modules:
- app.py: API server and endpoint logic
- data_ingestion.py: historical/latest data collection
- feature_engineering.py: feature computation pipeline
- prediction_engine.py: forecast training and inference
- llm_reasoning.py: explanation generation
- pipeline_scheduler.py: automation orchestrator

Frontend core area:
- portfolio-liquidity-insight-main/src
  - portfolio input and asset table
  - liquidity charts and heatmaps
  - future prediction components
  - AI insight cards and market ticker panels

## 13. Typical User Flow
1. User opens dashboard.
2. User selects market (US or India).
3. User adds symbols and quantities.
4. User runs liquidity analysis.
5. System returns score, risk band, and liquidation/impact indicators.
6. User requests future prediction and AI explanation.
7. User reviews trend direction and decides execution plan.
8. Optional report is generated for sharing.

## 14. Setup and Run Instructions

### 14.1 Prerequisites
- Python 3.8+
- Node.js 16+

### 14.2 Backend setup
- Install Python dependencies from requirements.
- Prepare market data and models through ingestion/setup scripts.

### 14.3 Frontend setup
- Install Node dependencies in frontend folder.
- Start Vite development server.

### 14.4 Fastest run path on Windows
- Use run_project.bat for one-click backend + frontend startup.
- Use start_menu.bat for interactive operations.

### 14.5 Access URLs
- Frontend US page: http://localhost:8080/
- Frontend India page: http://localhost:8080/india
- Backend API: http://localhost:5000

## 15. Business and Practical Use Cases
- Portfolio rebalancing with liquidity awareness.
- Pre-trade risk checks for large orders.
- Cross-market strategy comparison (US vs India).
- Treasury and risk oversight dashboards.
- Liquidity stress monitoring during volatile market phases.
- Analyst reporting with explainable forecasts.

## 16. Final Output for Hackathon/Demo
At demo time, this project delivers:
1. A working web app where user can enter a portfolio.
2. Current liquidity risk score and actionable risk indicators.
3. Future liquidity outlook for short-term horizon.
4. AI explanation to make model results easier to interpret.
5. Dual-market demonstration capability in one platform.
6. API endpoints that can be integrated into other systems.

## 17. Final Conclusion
This project solves a real execution-risk problem by converting raw market data into actionable liquidity intelligence.

Instead of only telling users what portfolio value is, it tells how tradable that value is now and how tradability is likely to evolve over the coming days.

That combination of scoring, forecasting, and explainable insights makes it highly useful for practical trading, risk management, and cross-market portfolio decision support.
