// scripts/generate_daily.js

/**
 * 這支腳本示範：每次執行時，產生一份簡單的每日推薦清單並存到 public/daily.json。
 * 在真實情境，你可以：
 *   1. 拿一個熱門幣種列表 (例如 CoinGecko Top 10)
 *   2. 對每個幣種做 /api/analyze 同樣的技術指標計算
 *   3. 根據你自訂的評分邏輯 (MACD 多頭、RSI 低於某值買點...) 排序
 *   4. 取前 3～5 名當作推薦，寫入 daily.json
 *
 * 這裡僅先示範成「寫死」的範例，方便你確認流程能正常跑。
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

async function main() {
  // 範例：選定 3 個幣種，之後可以改從 CoinGecko API 拿 Top 10 再篩。
  const topCoins = ['bitcoin', 'ethereum', 'chainlink'];
  const recommendations = [];

  for (let coin of topCoins) {
    // 1) 你也可以把分析邏輯寫成一個 func，這裡直接示範「寫死理由」
    recommendations.push({
      symbol: coin.toUpperCase(),
      reason: 'MACD 多頭，成交量放大',
    });
  }

  // 把結果寫到 public/daily.json
  const filePath = path.join(process.cwd(), 'public', 'daily.json');
  fs.writeFileSync(filePath, JSON.stringify(recommendations, null, 2));
  console.log('✅ 已更新 public/daily.json：', recommendations);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
