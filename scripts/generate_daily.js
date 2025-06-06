import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

async function main() {
  const topCoinsUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1';
  const res = await fetch(topCoinsUrl);
  const data = await res.json();
  const top10 = data.map(coin => coin.id);

  const recommendations = [];

  for (let id of top10) {
    // 假設將 CoinGecko ID 對應到 Binance 交易對，此處示範只針對 BTC, ETH, LINK
    let symbol = '';
    if (id === 'bitcoin') symbol = 'BTCUSDT';
    if (id === 'ethereum') symbol = 'ETHUSDT';
    if (id === 'chainlink') symbol = 'LINKUSDT';
    if (!symbol) continue;

    // 假設理由都是示範性文字，您可改成實際計算邏輯
    recommendations.push({
      symbol,
      reason: 'MACD 多頭，成交量放大'
    });
  }

  const filePath = path.join(process.cwd(), 'public', 'daily.json');
  fs.writeFileSync(filePath, JSON.stringify(recommendations, null, 2));
  console.log('Updated daily.json', recommendations);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
