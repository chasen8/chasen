// pages/api/analyze.js

import fetch from 'node-fetch';
import { macd as calcMACD, rsi as calcRSI } from 'technicalindicators';

export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: '必須提供 symbol 查詢參數，例如：?symbol=bitcoin' });
  }

  try {
    // 範例使用 CoinGecko 的 Market Chart API
    // CoinGecko API（免 API Key，但有速率限制）
    // API 參考：https://www.coingecko.com/api/documentations/v3#/coins/get_coins__id__market_chart
    const days = 60; // 過去 60 天價格
    const cgUrl = `https://api.coingecko.com/api/v3/coins/${symbol}/market_chart?vs_currency=usd&days=${days}`;
    const cgRes = await fetch(cgUrl);
    if (!cgRes.ok) {
      return res.status(500).json({ error: '無法取得 CoinGecko 資料，請確認幣種代號是否正確。' });
    }
    const cgData = await cgRes.json();
    // cgData.prices: [[timestamp, price], ...]
    // cgData.total_volumes: [[timestamp, volume], ...]

    // 擷取 Close Price 陣列與 Volume 陣列
    const prices = cgData.prices.map(p => p[1]);
    const volumes = cgData.total_volumes.map(v => v[1]);

    // 1) 計算 MACD：short=12, long=26, signal=9
    const macdInput = {
      values: prices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    };
    const macdResult = calcMACD(macdInput);
    const latestMACD = macdResult[macdResult.length - 1]; // { MACD, signal, histogram }

    // 2) 計算 RSI：period=14
    const rsiInput = {
      values: prices,
      period: 14,
    };
    const rsiResult = calcRSI(rsiInput);
    const latestRSI = rsiResult[rsiResult.length - 1]; // 一個數值

    // 3) 籌碼密集區 (支撐/壓力)
    //    先找出過去 N 天的最高價、最低價，然後切成 bins 段
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const bins = 20;
    const binSize = (maxPrice - minPrice) / bins;
    const zoneVolume = new Array(bins).fill(0);
    for (let i = 0; i < prices.length; i++) {
      const p = prices[i];
      const v = volumes[i];
      const idx = Math.min(bins - 1, Math.floor((p - minPrice) / binSize));
      zoneVolume[idx] += v;
    }
    // 找出量最集中的前兩個 bins，分別當作支撐、壓力參考
    const sortedZones = zoneVolume
      .map((vol, idx) => ({ idx, vol }))
      .sort((a, b) => b.vol - a.vol)
      .slice(0, 2);

    const supportZone = (minPrice + sortedZones[0].idx * binSize).toFixed(2);
    const resistanceZone = (minPrice + sortedZones[1].idx * binSize).toFixed(2);

    // 4) 建議進場、停利、停損
    const entryPrice = prices[prices.length - 1].toFixed(2); // 以最新價格做示範
    const takeProfit = (parseFloat(entryPrice) * 1.05).toFixed(2); // +5%
    const stopLoss = (parseFloat(entryPrice) * 0.97).toFixed(2); // -3%

    // 回傳結果
    return res.status(200).json({
      macd: {
        MACD: latestMACD.MACD,
        signal: latestMACD.signal,
        histogram: latestMACD.histogram,
      },
      rsi: latestRSI,
      supportZones: [supportZone],
      resistanceZones: [resistanceZone],
      entryPrice,
      takeProfit,
      stopLoss,
    });
  } catch (err) {
    console.error('API analyze 錯誤：', err);
    return res.status(500).json({ error: '伺服器內部錯誤，分析失敗' });
  }
}
