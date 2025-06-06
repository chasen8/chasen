// pages/index.js
import { useState, useEffect } from 'react';

export default function Home() {
  const [symbol, setSymbol] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dailyList, setDailyList] = useState([]);

  // 頁面載入時抓 daily.json
  useEffect(() => {
    fetch('/daily.json')
      .then(res => res.json())
      .then(data => setDailyList(data))
      .catch(err => {
        console.error('讀取 daily.json 失敗：', err);
        setDailyList([]);
      });
  }, []);

  // 當使用者點擊「分析」按鈕
  const fetchAnalysis = async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analyze?symbol=${symbol.toLowerCase()}`);
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error(err);
      setAnalysis({ error: '分析時發生錯誤，請稍後再試。' });
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>🔍 即時幣種分析 + 今日推薦</h1>

      {/* 1. 幣種輸入區 */}
      <section style={{ marginBottom: 40 }}>
        <h2>即時幣種分析</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="text"
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            placeholder="輸入幣種代號 (例如：bitcoin, ethereum)"
            style={{ flex: 1, padding: 8, fontSize: 16 }}
          />
          <button
            onClick={fetchAnalysis}
            style={{ padding: '8px 16px', fontSize: 16, cursor: 'pointer' }}
          >
            {loading ? '分析中...' : '分析'}
          </button>
        </div>

        {/* 顯示分析結果 */}
        {analysis && (
          <div style={{ marginTop: 20, padding: 16, border: '1px solid #ddd', borderRadius: 4 }}>
            {analysis.error && <p style={{ color: 'red' }}>{analysis.error}</p>}

            {!analysis.error && (
              <>
                <h3>📈 {symbol.toUpperCase()} 技術指標</h3>
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
                <h3>💡 建議進出場</h3>
                <p>
                  <strong>進場價：</strong> ${analysis.entryPrice}
                </p>
                <p>
                  <strong>停利 (TP)：</strong> ${analysis.takeProfit}
                </p>
                <p>
                  <strong>停損 (SL)：</strong> ${analysis.stopLoss}
                </p>
              </>
            )}
          </div>
        )}
      </section>

      <hr />

      {/* 2. 每日推薦區 */}
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
