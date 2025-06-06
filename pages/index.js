// pages/index.js
import { useState } from 'react';

export default function Home() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState('1h');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dailyList, setDailyList] = useState([]);

  // 預設熱門交易對
  const popularPairs = [
    'BTCUSDT','ETHUSDT','BNBUSDT','XRPUSDT','ADAUSDT',
    'SOLUSDT','MATICUSDT','DOGEUSDT','DOTUSDT','AVAXUSDT'
  ];

  // 頁面載入時抓 daily.json
  React.useEffect(() => {
    fetch('/daily.json')
      .then(res => res.json())
      .then(data => setDailyList(data))
      .catch(err => {
        console.error('讀取 daily.json 失敗：', err);
        setDailyList([]);
      });
  }, []);

  // 按下「分析」時
  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analyze?symbol=${symbol}&interval=${interval}`);
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error(err);
      setAnalysis({ error: '分析時發生錯誤，請稍後再試。' });
    }
    setLoading(false);
  };

  // 根據建議類型顯示中文
  const getSuggestionText = (s) => {
    if (s === 'long') return '建議做多';
    if (s === 'short') return '建議做空';
    return '建議觀望';
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>🔍 幣種技術分析 + 今日推薦</h1>

      {/* 1. 即時幣種分析區 */}
      <section style={{ marginBottom: 40, padding: 20, border: '1px solid #eee', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2>即時幣種分析</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
          <select 
            value={symbol} 
            onChange={e => setSymbol(e.target.value)}
            style={{ flex: 1, padding: 8, fontSize: 16 }}
          >
            {popularPairs.map((p, idx) => (
              <option key={idx} value={p}>{p}</option>
            ))}
          </select>
          <select 
            value={interval} 
            onChange={e => setInterval(e.target.value)}
            style={{ width: 100, padding: 8, fontSize: 16 }}
          >
            <option value="1h">1H</option>
            <option value="4h">4H</option>
            <option value="1d">1D</option>
          </select>
          <button
            onClick={fetchAnalysis}
            style={{ padding: '8px 16px', fontSize: 16, cursor: 'pointer' }}
          >
            {loading ? '分析中...' : '分析'}
          </button>
        </div>

        {/* 顯示分析結果 */}
        {analysis && (
          <div style={{ marginTop: 20, padding: 16, border: '1px solid #ddd', borderRadius: 4, backgroundColor: '#fafafa' }}>
            {analysis.error && <p style={{ color: 'red' }}>{analysis.error}</p>}

            {!analysis.error && (
              <>
                <h3>📈 {symbol} ({interval.toUpperCase()}) 技術指標</h3>
                <p>
                  <strong>MACD：</strong> {analysis.macd.MACD.toFixed(4)}，Signal:{' '}
                  {analysis.macd.signal.toFixed(4)}，Hist:{' '}
                  {analysis.macd.histogram.toFixed(4)}
                </p>
                <p>
                  <strong>RSI：</strong> {analysis.rsi.toFixed(2)}
                </p>
                <p>
                  <strong>支撐區 (Support)：</strong> {analysis.supportZones.join(', ')}
                </p>
                <p>
                  <strong>壓力區 (Resistance)：</strong> {analysis.resistanceZones.join(', ')}
                </p>
                <h3>💡 當前建議</h3>
                <p style={{ fontSize: 18 }}>
                  {getSuggestionText(analysis.suggestion)}
                </p>
              </>
            )}
          </div>
        )}
      </section>

      <hr />

      {/* 2. 每日必看推薦區 */}
      <section style={{ marginTop: 40 }}>
        <h2>🔥 今日必看推薦</h2>
        {dailyList.length === 0 && <p>今日尚無推薦，請稍後...</p>}
        {dailyList.length > 0 && (
          <ul>
            {dailyList.map((coin, idx) => (
              <li key={idx} style={{ marginBottom: 8 }}>
                <strong>{coin.symbol}</strong> &mdash; {coin.reason}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
