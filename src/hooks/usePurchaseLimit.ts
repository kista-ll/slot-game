import { useState, useEffect } from 'react';

const STORAGE_DATE_KEY = 'slotPurchaseDate';
const STORAGE_COUNT_KEY = 'slotPurchaseCount';
const MAX_PURCHASES_PER_DAY = 3;

const getTodayString = (): string => {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
};

const isToday = (dateStr: string): boolean => {
  return dateStr === getTodayString();
};

export const usePurchaseLimit = (max: number = MAX_PURCHASES_PER_DAY) => {
  const [count, setCount] = useState(0);
  const [canPurchase, setCanPurchase] = useState(true);

  useEffect(() => {
    const savedDate = localStorage.getItem(STORAGE_DATE_KEY) || '';
    const savedCount = parseInt(localStorage.getItem(STORAGE_COUNT_KEY) || '0', 10);

    if (isToday(savedDate)) {
      setCount(savedCount);
      setCanPurchase(savedCount < max);
    } else {
      // 新しい日 → カウントリセット
      localStorage.setItem(STORAGE_DATE_KEY, getTodayString());
      localStorage.setItem(STORAGE_COUNT_KEY, '0');
      setCount(0);
      setCanPurchase(true);
    }
  }, [max]);

  const increment = () => {
    const newCount = count + 1;
    setCount(newCount);
    localStorage.setItem(STORAGE_COUNT_KEY, newCount.toString());
    localStorage.setItem(STORAGE_DATE_KEY, getTodayString());
    setCanPurchase(newCount < max);
  };

  return {
    count,
    canPurchase,
    increment,
  };
};
