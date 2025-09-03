import React from 'react';

type Props = {
  history: string[][];
  symbolCounts: Record<string, number>;
};

export const HistoryPanel: React.FC<Props> = ({ history, symbolCounts }) => {
  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>履歴（最新10件）</h2>
    <ul style={{ listStyle: 'none', padding: 0, textAlign: 'center' }}>
      {history.map((entry, i) => (
        <li key={i}>{entry.join(' | ')}</li>
      ))}
    </ul>

      <h2>人気絵柄ランキング</h2>
      <ul style={{ listStyle: 'none', padding: 0, textAlign: 'center' }}>
        {Object.entries(symbolCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([symbol, count]) => (
            <li key={symbol}>
              {symbol}: {count}回
            </li>
          ))}
      </ul>
    </div>
  );
};
