// pages/api/analyze.js

import fetch from 'node-fetch';
import { macd as calcMACD, rsi as calcRSI } from 'technicalindicators';

/**
 * 這個 API Route 接受兩個 query 參數：
 *   1. symbol：Binance 交易對（例如：BTCUSDT、ETHUSDT…）
 *   2. interval：時間週期（1h、4h、1d）
 *
 * 回傳內容會包含：
 *   - MACD (MACD, signal, histogram)
 *   - RSI 
 *   - 支撐 / 壓力區間
 *   - 建議做多 / 做空 / 觀望
 */
export default async function handler(req, res) {
  // 1. 先取出 query 變數
  const { symbol, interval } = req.query;

  if (!symbol || !interval) {
    return res
      .status(400)
      .json({ error: '請提供 symbol 和 interval，例如：?symbol=BTCUSDT&interval=1h' });
  }

  // 2. Binance K 線參數：最多抓 500 根 K 線
  const limit = 500;
  const binanceInterval = interval; // 直接把前端傳進來的 "1h"、"4h"、"1d" 當作 Binance 的 interval

  // 3. 組成 Binance K 線 API 的 URL
  //    注意：這裡一定要使用反引號 `...`，不要在前面多打「斜線」！
  const klinesUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`;

  try {
    // 4. 向 Binance 拿 K 線資料
    const response = await fetch(klinesUrl);
    if (!response.ok) {
      return res
        .status(500)
        .json({ error: '無法取得 Binance K 線資料，請確認 symbol 或 interval 是否正確。' });
    }
    const klines = await response.json();
    // Binance K 線格式：每筆是 [ openTime, open, high, low, close, volume, … ]
    // 我們只需要 close 價和 volume，所以：
    const closes = klines.map((k) => parseFloat(k[4]));   // k[4] -> close 價
    const volumes = klines.map((k) => parseFloat(k[5]));  // k[5] -> 成交量

    // 5. 計算 MACD 和 RSI
    //    MACD：fastPeriod=12, slowPeriod=26, signalPeriod=9
    const macdInput = {
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    };
    const macdResult = calcMACD(macdInput);
    const latestMACD = macdResult[macdResult.length - 1]; // { MACD, signal, histogram }

    //    RSI：period=14
    const rsiInput = {
      values: closes,
      period: 14,
    };
    const rsiResult = calcRSI(rsiInput);
    const latestRSI = rsiResult[rsiResult.length - 1]; // e.g., 45.23

    // 6. 簡易「量價分箱」來找支撐 / 壓力區
    const minPrice = Math.min(...closes);
    const maxPrice = Math.max(...closes);
    const bins = 20;
    const binSize = (maxPrice - minPrice) / bins;
    const zoneVolume = new Array(bins).fill(0);
    for (let i = 0; i < closes.length; i++) {
      const p = closes[i];
      const v = volumes[i];
      const idx = Math.min(bins - 1, Math.floor((p - minPrice) / binSize));
      zoneVolume[idx] += v;
    }
    // 量最大的前兩個箱子當作支撐 / 壓力參考
    const sortedZones = zoneVolume
      .map((vol, idx) => ({ idx, vol }))
      .sort((a, b) => b.vol - a.vol)
      .slice(0, 2);

    const supportZone = (minPrice + sortedZones[0].idx * binSize).toFixed(2);
    const resistanceZone = (minPrice + sortedZones[1].idx * binSize).toFixed(2);

    // 7. 根據 MACD、RSI 簡單給「多 / 空 / 觀望」建議
    //    這裡示範最 Basic 的邏輯 (可自行調整)：
    //    - 如果 MACD.histogram > 0 且 RSI < 70，建議做多
    //    - 如果 MACD.histogram < 0 且 RSI > 30，建議做空
    //    - 其他情況就先觀望
    let advice = '觀望';
    if (latestMACD.histogram > 0 && latestRSI < 70) {
      advice = '建議做多';
    } else if (latestMACD.histogram < 0 && latestRSI > 30) {
      advice = '建議做空';
    }

    // 8. 回傳結果給前端
    return res.status(200).json({
      macd: {
        MACD: latestMACD.MACD,
        signal: latestMACD.signal,
        histogram: latestMACD.histogram,
      },
      rsi: latestRSI,
      supportZone,
      resistanceZone,
      advice,
    });
  } catch (err) {
    console.error('API analyze.js 內部錯誤：', err);
    return res.status(500).json({ error: '伺服器內部錯誤，分析失敗' });
  }
}
