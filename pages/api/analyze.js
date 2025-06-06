// pages/api/analyze.js

import fetch from 'node-fetch';
import { macd as calcMACD, rsi as calcRSI } from 'technicalindicators';

export default async function handler(req, res) {
  const symbol = (req.query.symbol || '').toUpperCase();
  const interval = (req.query.interval || '1h');

  if (!symbol) {
    return res.status(400).json({ error: '必須提供 symbol 查詢參數，例如：?symbol=BTCUSDT' });
  }

  // 驗證 interval
  const validIntervals = ['1h','4h','1d'];
  if (!validIntervals.includes(interval)) {
    return res.status(400).json({ error: 'Interval 參數只接受 1h、4h 或 1d' });
  }

  // Binance API 的 interval 對應
  let binanceInterval = interval;
  if (interval === '1d') binanceInterval = '1d';

  try {
    // 1) 從 Binance 拿 K 線資料 (limit=100)
    const limit = 100;
    const klinesUrl = \`https://api.binance.com/api/v3/klines?symbol=\${symbol}&interval=\${binanceInterval}&limit=\${limit}\`;
    const kRes = await fetch(klinesUrl);
    if (!kRes.ok) {
      return res.status(500).json({ error: '無法取得 Binance K 線資料，請確認交易對是否正確，且市場是否支援該 interval。' });
    }
    const klines = await kRes.json();
    // klines: [[openTime, open, high, low, close, volume, ...], ...]

    const closes = klines.map(k => parseFloat(k[4]));
    const volumes = klines.map(k => parseFloat(k[5]));
    if (closes.length < 30) {
      return res.status(500).json({ error: 'K 線資料不足，無法計算技術指標。' });
    }

    // 2) 計算 MACD：fast=12, slow=26, signal=9
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

    // 3) 計算 RSI：period=14
    const rsiInput = {
      values: closes,
      period: 14,
    };
    const rsiResult = calcRSI(rsiInput);
    const latestRSI = rsiResult[rsiResult.length - 1];

    // 4) 籌碼密集區 (支撐/壓力) - 用 (close * volume) 作加權
    const weightedVolumes = closes.map((c, i) => c * volumes[i]);
    const minPrice = Math.min(...closes);
    const maxPrice = Math.max(...closes);
    const bins = 20;
    const binSize = (maxPrice - minPrice) / bins;
    const zoneVolume = new Array(bins).fill(0);
    for (let i = 0; i < closes.length; i++) {
      const idx = Math.min(bins - 1, Math.floor((closes[i] - minPrice) / binSize));
      zoneVolume[idx] += weightedVolumes[i];
    }
    const sortedZones = zoneVolume
      .map((vol, idx) => ({ idx, vol }))
      .sort((a, b) => b.vol - a.vol)
      .slice(0, 2);

    const supportZone = (minPrice + sortedZones[0].idx * binSize).toFixed(4);
    const resistanceZone = (minPrice + sortedZones[1].idx * binSize).toFixed(4);

    // 5) 建議做多/做空/觀望
    // 簡單示例：若 histogram >0 且 RSI <70 => 做多；若 histogram <0 且 RSI >30 => 做空；否則觀望
    let suggestion = 'hold';
    if (latestMACD.histogram > 0 && latestRSI < 70) {
      suggestion = 'long';
    } else if (latestMACD.histogram < 0 && latestRSI > 30) {
      suggestion = 'short';
    }

    return res.status(200).json({
      macd: {
        MACD: latestMACD.MACD,
        signal: latestMACD.signal,
        histogram: latestMACD.histogram,
      },
      rsi: latestRSI,
      supportZones: [supportZone],
      resistanceZones: [resistanceZone],
      suggestion,
    });
  } catch (err) {
    console.error('API analyze 錯誤：', err);
    return res.status(500).json({ error: '伺服器內部錯誤，分析失敗' });
  }
}
