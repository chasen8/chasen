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
    let symbol = '';
    if (id === 'bitcoin') symbol = 'BTCUSDT';
    else if (id === 'ethereum') symbol = 'ETHUSDT';
    else if (id === 'binancecoin') symbol = 'BNBUSDT';
    else if (id === 'cardano') symbol = 'ADAUSDT';
    else if (id === 'ripple') symbol = 'XRPUSDT';
    else continue;

    recommendations.push({
      symbol,
      reason: '示範：MACD 多頭，成交量放大'
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
