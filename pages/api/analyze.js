import fetch from 'node-fetch';
import { macd as calcMACD, rsi as calcRSI } from 'technicalindicators';

export default async function handler(req, res) {
  const { symbol, interval } = req.query;
  if (!symbol || !interval) {
    return res.status(400).json({ error: '請提供 symbol 和 interval，例如：?symbol=BTCUSDT&interval=1h' });
  }

  const limit = 500;
  const binanceInterval = interval;
  const klinesUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`;

  try {
    const response = await fetch(klinesUrl);
    if (!response.ok) {
      return res.status(500).json({ error: '無法取得 Binance K 線資料，請確認 symbol 或 interval 是否正確。' });
    }
    const klines = await response.json();
    const closes = klines.map((k) => parseFloat(k[4]));
    const volumes = klines.map((k) => parseFloat(k[5]));

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

    const rsiInput = {
      values: closes,
      period: 14,
    };
    const rsiResult = calcRSI(rsiInput);
    const latestRSI = rsiResult[rsiResult.length - 1];

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
    const sortedZones = zoneVolume
      .map((vol, idx) => ({ idx, vol }))
      .sort((a, b) => b.vol - a.vol)
      .slice(0, 2);

    const supportZone = (minPrice + sortedZones[0].idx * binSize).toFixed(2);
    const resistanceZone = (minPrice + sortedZones[1].idx * binSize).toFixed(2);

    let advice = '觀望';
    if (latestMACD.histogram > 0 && latestRSI < 70) {
      advice = '建議做多';
    } else if (latestMACD.histogram < 0 && latestRSI > 30) {
      advice = '建議做空';
    }

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
    console.error('API analyze.js error:', err);
    return res.status(500).json({ error: '伺服器內部錯誤，分析失敗' });
  }
}
