import React, { useRef, useState, useEffect } from 'react';
import reelImage from '../assets/reel.png';
import '../SlotMachine.css';
import { BetControls } from './BetControls';

const symbolList = ['🍒', '🍋', '🔔', '⭐', '🍀', '7️⃣'];
const symbolHeight = 240;
const reelHeight = 240;
const totalSymbols = symbolList.length;

// 絵柄ごとの倍率設定
const payoutTable: Record<string, number> = {
  '🍒': 2,
  '🍋': 3,
  '🔔': 5,
  '⭐': 8,
  '🍀': 10,
  '7️⃣': 20,
};
const winSounds: Record<string, string> = {
  '🍒': '/sounds/win1.mp3',
  '🍋': '/sounds/win1.mp3',
  '🔔': '/sounds/win1.mp3',
  '⭐': '/sounds/win1.mp3',
  '🍀': '/sounds/win1.mp3',
  '7️⃣': '/sounds/win2.mp3',
};
const getTranslateY = (element: HTMLElement): number => {
  const style = window.getComputedStyle(element);
  const matrix = style.transform;
  const match = matrix.match(/matrix.*\((.+)\)/);
  if (match) {
    const values = match[1].split(', ');
    return parseFloat(values[5]);
  }
  return 0;
};

const getCenterSymbolIndex = (translateY: number): number => {
  const offset = Math.abs(translateY) + reelHeight / 2;
  return Math.floor(offset / symbolHeight) % totalSymbols;
};

export const SlotMachine: React.FC = () => {
  const reelRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const reelContainers = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  const [spinning, setSpinning] = useState([false, false, false]);
  const [result, setResult] = useState<string[]>(['❔', '❔', '❔']);
  const [history, setHistory] = useState<string[][]>([]);
  const [symbolCounts, setSymbolCounts] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number>(() => {
    const saved = localStorage.getItem('slotScore');
    return saved ? parseInt(saved, 10) : 100;
  });
  const [bet, setBet] = useState<number>(10);
  const [lastWinMessage, setLastWinMessage] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

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
    playSound('/sounds/spin.wav');
    reelRefs.forEach((ref) => {
      if (ref.current) {
        void ref.current.offsetWidth;
        ref.current.classList.add('fast');
        ref.current.style.transform = 'translateY(0)';
      }
    });
  };

  const stopReel = (index: number) => {
    const reel = reelRefs[index].current;
    const container = reelContainers[index].current;
    playSound('/sounds/stop.mp3');
    if (reel && container) {
      const actualY = getTranslateY(reel);
      reel.classList.remove('fast', 'slow');
      //reel.style.animation = 'none';

      const centerIndex = getCenterSymbolIndex(actualY);
      const symbol = symbolList[centerIndex];
      const translateY = -(centerIndex * symbolHeight);
      reel.style.transform = `translateY(${translateY}px)`;

      const betLevel = bet >= 50 ? 'high' : bet <= 10 ? 'low' : '';
      container.setAttribute('data-bet', betLevel);
      container.classList.add('stopping');
      setTimeout(() => container.classList.remove('stopping'), 300);

      setResult((prev) => {
        const updated = [...prev];
        updated[index] = symbol;
        return updated;
      });
    }

    setSpinning((prev) => {
      const updated = [...prev];
      updated[index] = false;
      return updated;
    });
  };

  const isAllStopped = spinning.every((s) => !s);
  const isWin = result.every((s) => s === result[0]);
  const playSound = (src: string) => {
    // 前の音を止める
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // 新しい音を再生
    const audio = new Audio(src);
    audio.volume = 1.0;
    audio.muted = false;
    audio.play().catch((err) => {
      console.error('Audio playback failed:', err);
    });

    // インスタンスを保存
    audioRef.current = audio;
  };
  const playWinSound = (symbol: string) => {
    const soundSrc = winSounds[symbol];
    if (!soundSrc) return;

    // 前の音を止める
    if (winAudioRef.current) {
      winAudioRef.current.pause();
      winAudioRef.current.currentTime = 0;
    }

    const audio = new Audio(soundSrc);
    audio.volume = 1.0;
    audio.play().catch((err) => {
      console.error('Win sound playback failed:', err);
    });

    winAudioRef.current = audio;
  };
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

        // 🎵 当たり音を鳴らす
        playWinSound(symbol);
      }
    }
  }, [isAllStopped]);

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>🎰 スロットゲーム</h1>

      <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
        残高: {score} 点
      </div>

      <BetControls bet={bet} score={score} setBet={setBet} />

      <button
        onClick={() => {
          const newScore = score + 100;
          setScore(newScore);
          localStorage.setItem('slotScore', newScore.toString());
        }}
        style={{ marginTop: '0.5rem' }}
      >
        残高を追加（+100点）
      </button>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
        {reelRefs.map((ref, i) => (
          <div key={i} className="reel" ref={reelContainers[i]}>
            <div className="reel-inner" ref={ref}>
              <img src={reelImage} alt={`reel-${i}`} />
              <img src={reelImage} alt={`reel-${i}-copy`} />
            </div>
          </div>
        ))}
      </div>

      <button onClick={startSpin} disabled={spinning.some((s) => s) || score < bet} style={{ marginTop: '1rem' }}>
        スピン！
      </button>

      <div style={{ marginTop: '1rem' }}>
        {spinning.map((s, i) => (
          <button
            key={i}
            onClick={() => stopReel(i)}
            disabled={!s}
            style={{ margin: '0 0.5rem' }}
          >
            リール{i + 1}ストップ
          </button>
        ))}
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
