// scripts/generate_daily.js

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { macd as calcMACD, rsi as calcRSI } from 'technicalindicators';

async function fetchTop10() {
  // 從 CoinGecko 抓取市場市值前 10 名幣種
  const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1';
  const res = await fetch(url);
  if (!res.ok) throw new Error('無法取得 CoinGecko Top10');
  return await res.json(); // 回傳 array of objects
}

async function analyzePair(symbol) {
  // 從 Binance 拿 1D K 線資料
  const interval = '1d';
  const limit = 100;
  const klinesUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const kRes = await fetch(klinesUrl);
  if (!kRes.ok) {
    throw new Error(\`Binance 取得 \${symbol} K 線失敗\`);
  }
  const klines = await kRes.json();
  const closes = klines.map(k => parseFloat(k[4]));
  const volumes = klines.map(k => parseFloat(k[5]));
  if (closes.length < 30) {
    throw new Error(\`\${symbol} K 線資料不足\`);
  }

  // MACD
  const macdInput = {
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  };
  const macdResult = calcMACD(macdInput);
  const latestMACD = macdResult[macdResult.length - 1];

  // RSI
  const rsiInput = {
    values: closes,
    period: 14,
  };
  const rsiResult = calcRSI(rsiInput);
  const latestRSI = rsiResult[rsiResult.length - 1];

  // 計算 score
  let score = 0;
  if (latestMACD.histogram > 0) score += 1;
  else score -= 1;
  if (latestRSI < 30) score += 1;
  else if (latestRSI > 70) score -= 1;

  // 給出理由
  const reasons = [];
  if (latestMACD.histogram > 0) reasons.push('MACD 多頭');
  else reasons.push('MACD 空頭');
  if (latestRSI < 30) reasons.push('RSI 超賣');
  else if (latestRSI > 70) reasons.push('RSI 超買');

  return {
    symbol,
    score,
    reason: reasons.join(' & ')
  };
}

async function main() {
  try {
    const top10 = await fetchTop10(); // array of { id, symbol, ... }
    const analyses = [];
    for (const coin of top10) {
      const pair = coin.symbol.toUpperCase() + 'USDT';
      try {
        const result = await analyzePair(pair);
        analyses.push(result);
      } catch (err) {
        console.error(err.message);
      }
    }
    // 排序
    analyses.sort((a, b) => b.score - a.score);
    // 取前三名
    const recommendations = analyses.slice(0, 3).map(a => ({
      symbol: a.symbol,
      reason: a.reason
    }));

    // 寫到 public/daily.json
    const filePath = path.join(process.cwd(), 'public', 'daily.json');
    fs.writeFileSync(filePath, JSON.stringify(recommendations, null, 2));
    console.log('✅ 已更新 public/daily.json：', recommendations);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
