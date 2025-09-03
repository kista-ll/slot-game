import React, { useState, useEffect, useRef } from 'react';
import { Reel } from './Reel';
import { BetControls } from './BetControls';
import { usePurchaseLimit } from '../hooks/usePurchaseLimit';
import { AudioController } from '../utils/AudioController';
import '../SlotMachine.css';

const payoutTable: Record<string, number> = {
  '🍒': 2, '🍋': 3, '🔔': 5, '⭐': 8, '🍀': 10, '7️⃣': 20,
};
const winSounds: Record<string, string> = {
  '🍒': '/sounds/win1.mp3', '🍋': '/sounds/win1.mp3',
  '🔔': '/sounds/win1.mp3', '⭐': '/sounds/win1.mp3',
  '🍀': '/sounds/win1.mp3', '7️⃣': '/sounds/win2.mp3',
};

export const SlotMachine: React.FC = () => {
  const [spinning, setSpinning] = useState([false, false, false]);
  const [result, setResult] = useState<string[]>(['❔', '❔', '❔']);
  const [score, setScore] = useState<number>(() => {
    const saved = localStorage.getItem('slotScore');
    return saved ? parseInt(saved, 10) : 100;
  });
  const [bet, setBet] = useState<number>(10);
  const [lastWinMessage, setLastWinMessage] = useState('');
  const [history, setHistory] = useState<string[][]>([]);
  const [symbolCounts, setSymbolCounts] = useState<Record<string, number>>({});

  const audioController = useRef(new AudioController()).current;
  const winAudioController = useRef(new AudioController()).current;

  const {
    count: purchaseCount,
    canPurchase,
    increment: incrementPurchase,
  } = usePurchaseLimit(3);

  useEffect(() => {
    const savedHistory = localStorage.getItem('slotHistory');
    const savedCounts = localStorage.getItem('slotCounts');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedCounts) setSymbolCounts(JSON.parse(savedCounts));
  }, []);

  const startSpin = () => {
    if (score < bet) return;
    setSpinning([true, true, true]);
    setResult(['❔', '❔', '❔']);
    setLastWinMessage('');
    setScore((prev) => {
      const newScore = prev - bet;
      localStorage.setItem('slotScore', newScore.toString());
      return newScore;
    });
    audioController.play('/sounds/spin.wav');
  };

  const stopReel = (index: number, symbol: string) => {
    audioController.play('/sounds/stop.mp3');
    setSpinning((prev) => {
      const updated = [...prev];
      updated[index] = false;
      return updated;
    });
    setResult((prev) => {
      const updated = [...prev];
      updated[index] = symbol;
      return updated;
    });
  };

  const playWinSound = (symbol: string) => {
    const src = winSounds[symbol];
    if (src) {
      winAudioController.play(src);
    }
  };

  const handlePurchase = () => {
    if (!canPurchase) return;
    const added = 100;
    const newScore = score + added;
    setScore(newScore);
    localStorage.setItem('slotScore', newScore.toString());
    incrementPurchase();
  };

  const isAllStopped = spinning.every((s) => !s);
  const isWin = result.every((s) => s === result[0]);

  useEffect(() => {
    if (isAllStopped && result.every((r) => r !== '❔')) {
      const newHistory = [result, ...history.slice(0, 9)];
      setHistory(newHistory);
      localStorage.setItem('slotHistory', JSON.stringify(newHistory));

      const updatedCounts = { ...symbolCounts };
      result.forEach((symbol) => {
        updatedCounts[symbol] = (updatedCounts[symbol] || 0) + 1;
      });
      setSymbolCounts(updatedCounts);
      localStorage.setItem('slotCounts', JSON.stringify(updatedCounts));

      if (isWin) {
        const symbol = result[0];
        const multiplier = payoutTable[symbol] || 1;
        const reward = bet * multiplier;
        const newScore = score + reward;
        setScore(newScore);
        localStorage.setItem('slotScore', newScore.toString());
        setLastWinMessage(`${symbol}で${multiplier}倍！ +${reward}点`);
        playWinSound(symbol);
      }
    }
  }, [isAllStopped]);

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>🎰 スロットゲーム</h1>
      <div>残高: {score} 点</div>

      <BetControls bet={bet} score={score} setBet={setBet} />

      <button
        onClick={handlePurchase}
        disabled={!canPurchase}
        style={{ marginTop: '0.5rem' }}
      >
        残高を購入（+100点） {purchaseCount}/3
      </button>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[0, 1, 2].map((i) => (
            <Reel
              key={i}
              index={i}
              spinning={spinning[i]}
              onStop={(symbol) => stopReel(i, symbol)}
            />
          ))}
        </div>

        <button
          onClick={startSpin}
          disabled={spinning.some((s) => s) || score < bet}
          className="lever-button"
        >
          🎯
        </button>
      </div>

      {isAllStopped && (
        <div style={{ marginTop: '1rem', fontSize: '1.5rem' }}>
          {isWin ? `🎉 大当たり！ ${lastWinMessage}` : '😢 はずれ...'}
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h2>履歴（最新10件）</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {history.map((entry, i) => (
            <li key={i}>{entry.join(' | ')}</li>
          ))}
        </ul>

        <h2>人気絵柄ランキング</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {Object.entries(symbolCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([symbol, count]) => (
              <li key={symbol}>{symbol}: {count}回</li>
            ))}
        </ul>
      </div>
    </div>
  );
};
