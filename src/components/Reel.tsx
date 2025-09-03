import React, { useEffect, useRef, useState } from 'react';
import './Reel.css';

type Props = {
  spinning: boolean;
  onStop: (symbol: string) => void;
  index: number;
};

const symbolList = ['🍒', '🍋', '7️⃣', '🔔', '🍀', '⭐'];
const symbolImages: Record<string, string> = {
  '🍒': '/images/cherry.png',
  '🍋': '/images/lemon.png',
  '🔔': '/images/bell.png',
  '⭐': '/images/star.png',
  '🍀': '/images/clover.png',
  '7️⃣': '/images/seven.png',
};
const symbolHeight = 240;
const reelHeight = 240;
const totalSymbols = symbolList.length;

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

export const Reel: React.FC<Props> = ({ spinning, onStop, index }) => {
  const reelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [centerIndex, setCenterIndex] = useState<number | null>(null);
  const [popClass, setPopClass] = useState('');

  useEffect(() => {
    if (spinning && reelRef.current) {
      reelRef.current.classList.add('fast');
      reelRef.current.style.transform = 'translateY(0)';
      setCenterIndex(null);
      setPopClass('');
    }
  }, [spinning]);

  const stop = () => {
    const reel = reelRef.current;
    const container = containerRef.current;
    if (reel && container) {
      const actualY = getTranslateY(reel);
      reel.classList.remove('fast', 'slow');

      const center = getCenterSymbolIndex(actualY);
      const symbol = symbolList[center];
      const translateY = -(center * symbolHeight);
      reel.style.transform = `translateY(${translateY}px)`;

      container.classList.add('stopping');
      setTimeout(() => container.classList.remove('stopping'), 300);

      setCenterIndex(center);
      setPopClass('pop');
      setTimeout(() => setPopClass(''), 400);

      onStop(symbol);
    }
  };

  return (
    <div className="reel-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="reel" ref={containerRef}>
        <div className="reel-inner" ref={reelRef}>
          {symbolList.map((symbol, i) => {
            const isCenter = i === centerIndex;
            const className = isCenter ? `center ${popClass}` : '';
            return (
              <img
                key={i}
                src={symbolImages[symbol]}
                alt={symbol}
                className={className}
              />
            );
          })}
        </div>
      </div>

      {spinning && (
        <button
          onClick={stop}
          style={{ marginTop: '0.5rem' }}
        >
          リール{index + 1}ストップ
        </button>
      )}
    </div>
  );
};
