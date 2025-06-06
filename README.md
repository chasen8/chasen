# My Crypto Analyzer

這個專案示範如何使用 **Next.js** + **Vercel Serverless Functions** + **GitHub Actions**，打造一個具有以下兩個主要功能的區塊鏈分析網站：

1. **即時幣種分析**：  
   - 使用者在前端輸入幣種代號（例如 BTC、ETH），後端抓取 CoinGecko 歷史價格資料  
   - 計算 MACD、RSI、籌碼密集區（支撐／壓力）、並回傳建議進場、停利、停損價格  

2. **每日必看推薦**：  
   - GitHub Actions 每天定時（UTC 01:00，台北時間 09:00）執行 `scripts/generate_daily.js`  
   - 產生一份 `public/daily.json`，內容為當日推薦幣種清單和理由  
   - 前端每次打開網頁都會讀取 `daily.json`，顯示「今日推薦」  

----

## 專案安裝與執行

1. **Clone 到本機**  
   ```bash
   git clone https://github.com/<你的帳號>/my-crypto-analyzer.git
   cd my-crypto-analyzer
   ```

2. **安裝依賴**  
   ```bash
   npm install
   ```

3. **本機開發模式**  
   ```bash
   npm run dev
   ```
   然後開啟瀏覽器：http://localhost:3000

4. **編譯並啟動**（模擬 Vercel 正式環境）  
   ```bash
   npm run build
   npm start
   ```

5. **推到 GitHub 後**，在 Vercel 上連結此 Repo，Vercel 會自動偵測為 Next.js 專案並完成部署。  
   - 若需要使用 CoinGecko 以外的 API（例如需要 API Key），請到 Vercel Dashboard 設定 Environment Variable，例如 `COINGECKO_API_KEY`、`BINANCE_API_KEY`。

----

## 目錄簡介

```
my-crypto-analyzer/
├─ public/daily.json
    每日推薦的 JSON 檔，每天由 GitHub Actions 產生。
├─ pages/index.js
    前端主頁，負責顯示即時分析與每日推薦。
├─ pages/api/analyze.js
    Serverless Function，根據傳入的 symbol 參數，呼叫 CoinGecko API，計算技術指標後回傳 JSON。
├─ scripts/generate_daily.js
    用於 GitHub Actions，每天執行，產生 public/daily.json。
├─ .github/workflows/daily.yml
    GitHub Actions 排程設定，定時執行 `scripts/generate_daily.js`。
```

---

## 二、各檔案內容

### 1. `package.json`

```json
{
  "name": "my-crypto-analyzer",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "12.3.4",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "technicalindicators": "^3.0.5"
  },
  "devDependencies": {
    "node-fetch": "^2.6.7"
  }
}
```

> **說明**：  
> - 我們使用 Next.js 12.x 系列作為範例，你可以依照並不需要特別調整。  
> - `technicalindicators` 用來計算 MACD、RSI 等技術指標。  
> - `node-fetch` 作為 Node.js 環境下呼叫 HTTP API 的 helper。Next.js API Route 其實可直接用內建 fetch，但為了相容性這裡加上 `node-fetch`。
