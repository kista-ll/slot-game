## 🎯 スロットゲーム仕様書（React + TypeScript）

### 1. ゲーム概要
- 3リール式スロットゲーム
- プレイヤーはベット額を設定し、スピンして絵柄を揃える
- 絵柄が揃うと倍率に応じた報酬を獲得
- スピン・ストップ・当たり時に音声演出あり
- 履歴・絵柄出現回数をローカルストレージに保存
- リール停止ボタンは各リールに統合済み（Reel.tsx内）

---

### 2. 絵柄と倍率設定（順番変更済み）

| 絵柄 | 倍率 | 当たり音 |
|------|------|-----------|
| 🍒   | 2倍  | win1.mp3  |
| 🍋   | 3倍  | win1.mp3  |
| 7️⃣  | 20倍 | win2.mp3  |
| 🔔   | 5倍  | win1.mp3  |
| 🍀   | 10倍 | win1.mp3  |
| ⭐   | 8倍  | win1.mp3  |

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
  audio.play().catch(() => {});
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

### 4. スピン処理（SlotMachine.tsx）

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
};
```

---

### 5. リール停止処理（Reel.tsx）

- 停止ボタンは各リールに統合されており、`spinning` が `true` のときのみ表示
- 停止時に絵柄を中央に揃え、演出（拡大・浮き上がり）を適用
- 停止後に `onStop(symbol)` を親に通知

---

### 6. 当たり判定と報酬処理（SlotMachine.tsx）

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

### 8. コンポーネント構成

| ファイル名         | 役割                                 |
|--------------------|--------------------------------------|
| `SlotMachine.tsx`  | ゲーム全体の状態管理とUI             |
| `Reel.tsx`         | リールの描画・回転・停止・演出       |
| `BetControls.tsx`  | ベット額の調整UI                     |
| `Reel.css`         | リールの見た目とアニメーション       |
| `SlotMachine.css`  | ゲーム全体のレイアウトと共通スタイル |

---

### 9. 拡張のアイデア 💡
- 🎵 音量調整スライダーの追加
- 🎨 絵柄ごとのアニメーション演出
- 🏆 スコアランキング機能（ローカル or サーバー連携）
- 🔁 オートスピン機能
- 🎧 音声コントローラーの導入（音が増えたら）
