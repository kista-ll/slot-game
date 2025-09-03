import { useEffect, useState } from 'react';

export const usePurchaseLimit = (maxPerDay: number) => {
  const [count, setCount] = useState(0);
  const [isToday, setIsToday] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const savedDate = localStorage.getItem('slotPurchaseDate');
    const savedCount = parseInt(localStorage.getItem('slotPurchaseCount') || '0', 10);

    if (savedDate === today) {
      setCount(savedCount);
    } else {
      localStorage.setItem('slotPurchaseDate', today);
      localStorage.setItem('slotPurchaseCount', '0');
      setCount(0);
      setIsToday(false);
    }
  }, []);

  const increment = () => {
    const today = new Date().toISOString().slice(0, 10);
    const newCount = count + 1;
    setCount(newCount);
    localStorage.setItem('slotPurchaseCount', newCount.toString());
    localStorage.setItem('slotPurchaseDate', today);
  };

  const canPurchase = count < maxPerDay;

  return { count, canPurchase, increment };
};
