# My Crypto Analyzer (Updated)

這個專案使用 **Next.js** + **Vercel Serverless Functions** + **GitHub Actions**，並加入以下功能：

1. **即時幣種分析（支援 Binance 交易對 + 1H/4H/1D 分析）**  
   - 使用者從下拉選單選擇交易對（例如 BTCUSDT、ETHUSDT），並選擇分析週期（1H、4H、1D）。  
   - 後端呼叫 Binance Kline API，計算 MACD、RSI、支撐/壓力、並給出做多/做空/觀望建議。  

2. **每日必看推薦（自動抓取 CoinGecko Top 10，依技術指標打分並選前三名）**  
   - GitHub Actions 每日定時（UTC 01:00，台北時間 09:00）執行 `scripts/generate_daily.js`。  
   - 透過 CoinGecko API 取得 Top 10 幣種，並用 Binance 1D Kline 計算技術指標，根據分數排序後選出前三名。  
   - 結果寫入 `public/daily.json`，前端自動更新顯示。  

---

## 專案結構

```
my-crypto-analyzer-updated/
├─ .gitignore
├─ README.md
├─ package.json
├─ next.config.js
├─ public/
│   └─ daily.json
├─ scripts/
│   └─ generate_daily.js
├─ pages/
│   ├─ index.js
│   └─ api/
│       └─ analyze.js
└─ .github/
    └─ workflows/
        └─ daily.yml
```

## 安裝與執行

1. **Clone & Push to GitHub**  
   - 確認 `.gitignore` 已經包含 `node_modules/`，不要上傳 `node_modules`。  
   ```bash
   git clone https://github.com/<你的帳號>/my-crypto-analyzer-updated.git
   cd my-crypto-analyzer-updated
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. **Vercel 部署**  
   - 在 Vercel 中匯入 GitHub 專案，Vercel 會自動執行 `npm install`、`npm run build`、`npm start`。  
   - 確保在 Vercel 上設定好必要的 Environment Variables（若使用額外 API Key）。  

3. **本機開發模式（可選）**  
   ```bash
   npm install
   npm run dev
   ```
   然後瀏覽器打開 `http://localhost:3000`。

4. **手動觸發推薦排程**  
   - 到 GitHub Repo → Actions → 找到 “每日幣種推薦生成” → Run workflow → 等完成。  
   - `public/daily.json` 會被更新，Vercel 重新部署後，前端會顯示「今日必看推薦」。  

---

## 技術要點

- **Binance Kline API**  
  - Route: `https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit={limit}`  
  - 分析 1H/4H: `interval=1h`、`interval=4h`；1D: `interval=1d`。  
  - 取最近 100 支 K 線，計算 MACD（12,26,9）、RSI（14）、支撐/壓力。  

- **CoinGecko Top 10**  
  - Route: `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1`  
  - 取 `symbol` 字段 (小寫)，轉為大寫加 “USDT” 作為 Binance 交易對。  

- **推薦打分機制（簡易示範）**  
  - 若 MACD histogram > 0，score += 1；若 < 0，score -= 1。  
  - 若 RSI < 30，score += 1 (超賣可能反彈)；若 RSI > 70，score -= 1 (超買可能回調)。  
  - 最終依照 score 排序，取前三名，並生成理由。  

- **前端 UI**  
  - 下拉選單顯示熱門交易對：BTCUSDT、ETHUSDT、BNBUSDT、XRPUSDT、ADAUSDT、SOLUSDT、MATICUSDT、DOGEUSDT、DOTUSDT、AVAXUSDT  
  - 下拉選單選擇分析週期：1H、4H、1D  
  - 按下「分析」後，顯示技術指標、支撐/壓力、做多/做空/觀望建議  
  - 使用簡單 CSS + FlexBox 讓畫面更美觀  

---

## 文件

- [Binance API 文件](https://binance-docs.github.io/apidocs/spot/en/#kline-candlestick-data)  
- [CoinGecko API 文件](https://www.coingecko.com/api/documentations/v3)  

---

歡迎依據需求修改、優化。