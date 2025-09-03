import React from 'react';
import './BetControls.css';

type Props = {
  bet: number;
  score: number;
  setBet: (value: number) => void;
};

export const BetControls: React.FC<Props> = ({ bet, score, setBet }) => {
  const increase = () => setBet(Math.min(score, bet + 1));
  const decrease = () => setBet(Math.max(1, bet - 1));
  const allIn = () => setBet(score);
  const resetToTen = () => setBet(10);

  return (
    <div style={{ marginTop: '1rem' }}>
      <label style={{ marginRight: '0.5rem' }}>賭け点:</label>
      <button onClick={decrease} disabled={bet <= 1}>−</button>
      <span style={{ margin: '0 1rem' }}>{bet} 点</span>
      <button onClick={increase} disabled={bet >= score}>＋</button>
      <button onClick={allIn} disabled={score <= 1} style={{ marginLeft: '1rem' }}>
        オールイン
      </button>
      <button onClick={resetToTen} style={{ marginLeft: '0.5rem' }}>
        リセット（10点）
      </button>
    </div>
  );
};
