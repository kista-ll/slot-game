import React, { useState, useEffect, useRef } from 'react';
import { Reel } from './Reel';
import { BetControls } from './BetControls';
import { HistoryPanel } from './HistoryPanel';
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
  const [reachActive, setReachActive] = useState(false);
  const [reachTargets, setReachTargets] = useState<number[]>([]);

  const audioController = useRef(new AudioController()).current;
  const winAudioController = useRef(new AudioController()).current;
  const reachAudioController = useRef(new AudioController()).current;

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
    setReachActive(false);
    setReachTargets([]);
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
      // 最後のリールが止まったらリーチ演出を解除
      const allStopped = updated.every((s) => !s);
      if (allStopped) {
        setReachActive(false);
        setReachTargets([]);
      }
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

  // リーチ判定
  useEffect(() => {
    const stopped = result
      .map((symbol, i) => ({ symbol, i }))
      .filter(({ symbol }) => symbol !== '❔');

    if (stopped.length >= 2) {
      const [first, second] = stopped;
      if (first.symbol === second.symbol) {
        const targets = spinning
          .map((s, i) => (s ? i : null))
          .filter((i): i is number => i !== null);

        if (targets.length > 0) {
          setReachActive(true);
          setReachTargets(targets);
          reachAudioController.play('/sounds/reach.wav');
        }
      }
    } else {
      setReachActive(false);
      setReachTargets([]);
    }
  }, [result, spinning]);

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
    <div className="slot-machine-frame" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="slot-header">🎰 スロットゲーム</div>
      <div>残高: {score} 点</div>

      <BetControls bet={bet} score={score} setBet={setBet} />

      <button
      onClick={handlePurchase}
      disabled={!canPurchase}
      style={{ marginTop: '0.5rem' }}
      >
      残高を購入（+100点） {purchaseCount}/3
      </button>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '4rem', // 高さを一定にする
          justifyContent: 'center',
        }}
      >
        {isAllStopped && (
          <div style={{ marginTop: '1rem', fontSize: '1.5rem' }}>
        {isWin ? `🎉 大当たり！ ${lastWinMessage}` : '😢 はずれ...'}
          </div>
        )}

        {reachActive && (
          <div className="reach-banner">
        🎯 リーチ！
          </div>
        )}
      </div>
      <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '1rem',
        marginTop: '1rem',
      }}
      >
      {/* レバーを左にしたい場合 */}
      <button
        onClick={startSpin}
        disabled={spinning.some((s) => s) || score < bet}
        className="lever-button"
      >
        🎯
      </button>

      {/* リール群 */}
      <div className="reel-area" >
        {[0, 1, 2].map((i) => (
        <Reel
          key={i}
          index={i}
          spinning={spinning[i]}
          onStop={(symbol) => stopReel(i, symbol)}
          isReachTarget={reachActive && reachTargets.includes(i)}
        />
        ))}
      </div>

      {/* レバーを右にしたい場合はこのボタンを右側に移動 */}
      </div>
      <HistoryPanel history={history} symbolCounts={symbolCounts} />
    </div>

  );
};
