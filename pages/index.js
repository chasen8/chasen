import React, { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [symbol, setSymbol] = useState('');
  const [interval, setIntervalState] = useState('1h');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dailyList, setDailyList] = useState([]);

  useEffect(() => {
    fetch('/daily.json')
      .then(res => res.json())
      .then(data => setDailyList(data))
      .catch(err => {
        console.error('Failed to load daily.json:', err);
        setDailyList([]);
      });
  }, []);

  const fetchAnalysis = async () => {
    if (!symbol) return;
    setLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch(`/api/analyze?symbol=${symbol}&interval=${interval}`);
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error(err);
      setAnalysis({ error: 'Analysis error. Please try again later.' });
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🔍 即時幣種分析 + 今日推薦</h1>

      <section className={styles.section}>
        <h2>即時幣種分析</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            className={styles.select}
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
          >
            <option value="">請選擇交易對 (symbol)</option>
            <option value="BTCUSDT">BTCUSDT</option>
            <option value="ETHUSDT">ETHUSDT</option>
            <option value="LINKUSDT">LINKUSDT</option>
            <option value="BNBUSDT">BNBUSDT</option>
            <option value="ADAUSDT">ADAUSDT</option>
          </select>

          <div>
            <button
              onClick={() => setIntervalState('1h')}
              className={`${styles.intervalButton} ${
                interval === '1h' ? 'active' : 'inactive'
              }`}
            >
              1H
            </button>
            <button
              onClick={() => setIntervalState('4h')}
              className={`${styles.intervalButton} ${
                interval === '4h' ? 'active' : 'inactive'
              }`}
            >
              4H
            </button>
            <button
              onClick={() => setIntervalState('1d')}
              className={`${styles.intervalButton} ${
                interval === '1d' ? 'active' : 'inactive'
              }`}
            >
              1D
            </button>
          </div>

          <button
            onClick={fetchAnalysis}
            disabled={!symbol || loading}
            className={styles.analyzeButton}
          >
            {loading ? '分析中...' : '分析'}
          </button>
        </div>

        {analysis && (
          <div className={styles.resultBox}>
            {analysis.error && <p style={{ color: 'red' }}>{analysis.error}</p>}
            {!analysis.error && (
              <>
                <h3>📈 {symbol} ({interval}) 分析結果</h3>
                <p><strong>MACD：</strong> {analysis.macd.MACD.toFixed(4)}, Signal: {analysis.macd.signal.toFixed(4)}, Hist: {analysis.macd.histogram.toFixed(4)}</p>
                <p><strong>RSI：</strong> {analysis.rsi.toFixed(2)}</p>
                <p><strong>支撐區 (Support)：</strong> {analysis.supportZone}</p>
                <p><strong>壓力區 (Resistance)：</strong> {analysis.resistanceZone}</p>
                <h3>💡 建議：</h3>
                <p className={styles.advice}>{analysis.advice}</p>
              </>
            )}
          </div>
        )}
      </section>

      <hr />

      <section className={styles.section}>
        <h2>🔥 今日必看推薦</h2>
        {dailyList.length === 0 && <p>今日尚無推薦，請稍後...</p>}
        {dailyList.length > 0 && (
          <ul>
            {dailyList.map((coin, idx) => (
              <li key={idx} className={styles.dailyListItem}>
                <strong>{coin.symbol}</strong> — {coin.reason}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
