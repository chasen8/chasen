import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    // Fetch Binance Futures exchangeInfo
    const infoUrl = 'https://fapi.binance.com/fapi/v1/exchangeInfo';
    const response = await fetch(infoUrl);
    if (!response.ok) {
      return res.status(500).json({ error: '無法取得交易所資訊' });
    }
    const data = await response.json();
    // Extract symbols that end with USDT
    const symbols = data.symbols
      .filter(s => s.contractType === 'PERPETUAL' && s.symbol.endsWith('USDT'))
      .map(s => s.symbol)
      .sort();
    return res.status(200).json(symbols);
  } catch (err) {
    console.error('API symbols.js error:', err);
    return res.status(500).json({ error: '伺服器內部錯誤，無法取得幣種列表' });
  }
}
