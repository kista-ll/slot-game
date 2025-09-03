以下は、あなたのスロットゲームの仕様書です。音声演出の追加や絵柄ごとの当たり音再生など、最新の実装内容を反映しています 🎰🔊

---

## 🎯 スロットゲーム仕様書（React + TypeScript）

### 1. ゲーム概要
- 3リール式スロットゲーム
- プレイヤーはベット額を設定し、スピンして絵柄を揃える
- 絵柄が揃うと倍率に応じた報酬を獲得
- スピン・ストップ・当たり時に音声演出あり
- 履歴・絵柄出現回数をローカルストレージに保存

---

### 2. 絵柄と倍率設定

| 絵柄 | 倍率 | 当たり音 |
|------|------|-----------|
| 🍒   | 2倍  | win1.mp3  |
| 🍋   | 3倍  | win1.mp3  |
| 🔔   | 5倍  | win1.mp3  |
| ⭐   | 8倍  | win1.mp3  |
| 🍀   | 10倍 | win1.mp3  |
| 7️⃣  | 20倍 | win2.mp3  |

---

### 3. 音声演出仕様

| イベント       | 音声ファイル         | 備考                         |
|----------------|----------------------|------------------------------|
| スピン開始     | `/sounds/spin.wav`   | 前回の音を停止して再生      |
| リール停止     | `/sounds/stop.mp3`   | 各リール停止時に再生        |
| 当たり演出     | `/sounds/winX.mp3`   | 絵柄に応じて異なる音を再生  |

#### 音声再生関数（共通）

```ts
const audioRef = useRef<HTMLAudioElement | null>(null);

const playSound = (src: string) => {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }
  const audio = new Audio(src);
  audio.volume = 1.0;
  audio.muted = false;
  audio.play().catch((err) => {
    console.error('Audio playback failed:', err);
  });
  audioRef.current = audio;
};
```

#### 当たり音再生関数

```ts
const winAudioRef = useRef<HTMLAudioElement | null>(null);

const playWinSound = (symbol: string) => {
  const soundSrc = winSounds[symbol];
  if (!soundSrc) return;

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
```

---

### 4. スピン処理

```ts
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
```

---

### 5. リール停止処理

```ts
const stopReel = (index: number) => {
  const reel = reelRefs[index].current;
  const container = reelContainers[index].current;
  playSound('/sounds/stop.mp3');
  if (reel && container) {
    const actualY = getTranslateY(reel);
    reel.classList.remove('fast', 'slow');
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
```

---

### 6. 当たり判定と報酬処理

```ts
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
```

---

### 7. ローカルストレージ保存内容

| キー名         | 内容                     |
|----------------|--------------------------|
| `slotScore`    | 現在のスコア             |
| `slotHistory`  | 最新10件の結果履歴       |
| `slotCounts`   | 絵柄ごとの出現回数       |

---

### 8. 拡張のアイデア 💡
- 🎵 音量調整スライダーの追加
- 🎨 絵柄ごとのアニメーション演出
- 🏆 スコアランキング機能（ローカル or サーバー連携）
- 🔁 オートスピン機能

---

この仕様書をベースに、さらに演出や機能を追加していくこともできます。  
もしPDFやドキュメント形式でまとめたい場合は、別途ご相談ください！