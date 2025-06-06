# My Crypto Analyzer (Corrected)

This is a Next.js project with corrected directory structure and styling using the specified color palette.

## Features
1. **Real-time coin analysis** with Binance K-line data for 1H, 4H, 1D.
2. **Daily Top-3 recommendations** by fetching CoinGecko Top 10 and scoring with MACD/RSI.

## How to Deploy
1. Push this repo to GitHub.
2. Connect to Vercel and let it build & deploy automatically.
3. Trigger GitHub Actions manually or wait for the scheduled run to update `public/daily.json`.

Directory structure must have `pages/` at the root to avoid build errors.
