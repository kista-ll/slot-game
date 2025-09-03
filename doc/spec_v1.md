## 🎯 スロットゲーム仕様書（React + TypeScript）

### 1. ゲーム概要
- 3リール式スロットゲーム
- プレイヤーはベット額を設定し、スピンして絵柄を揃える
- 絵柄が揃うと倍率に応じた報酬を獲得
- スピン・ストップ・リーチ・当たり時に音声演出あり
- 履歴・絵柄出現回数・残高・購入制限をローカルストレージに保存
- リール停止ボタンは常時表示され、回転中のみ有効（Reel.tsx内）
- リーチ演出あり：停止済みの最初の2リールが一致した場合に発動

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
| リーチ演出     | `/sounds/reach.wav`  | リーチ成立時に再生          |
| 当たり演出     | `/sounds/winX.mp3`   | 絵柄に応じて異なる音を再生  |

---

### 4. スピン処理（SlotMachine.tsx）

```ts
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
```

---

### 5. リール停止処理（Reel.tsx）

- 停止ボタンは常時表示され、`spinning` が `true` のときのみ有効（`disabled`）
- 停止時に絵柄を中央に揃え、演出（拡大・浮き上がり）を適用
- 停止後に `onStop(symbol)` を親に通知
- 最後のリール停止時にリーチ演出を解除

---

### 6. リーチ演出（SlotMachine.tsx）

- 停止済みの最初の2リールの絵柄が一致した場合に発動
- 回転中のリールに光る演出（CSS）
- リーチSE（`reach.wav`）を再生
- 画面中央に「🎯 リーチ！」を表示（点滅）

---

### 7. 当たり判定と報酬処理（SlotMachine.tsx）

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

### 8. 残高購入制限（usePurchaseLimit.ts）

- 1回につき +100点
- 1日最大3回まで購入可能
- 購入回数と日付を localStorage に保存
- `canPurchase` によってボタンの有効/無効を制御

---

### 9. ローカルストレージ保存内容

| キー名                 | 内容                     |
|------------------------|--------------------------|
| `slotScore`            | 現在のスコア             |
| `slotHistory`          | 最新10件の結果履歴       |
| `slotCounts`           | 絵柄ごとの出現回数       |
| `slotPurchaseDate`     | 最終購入日（YYYY-MM-DD） |
| `slotPurchaseCount`    | 当日購入回数（最大3）    |

---

### 10. コンポーネント構成

| ファイル名             | 役割                                 |
|------------------------|--------------------------------------|
| `SlotMachine.tsx`      | ゲーム全体の状態管理とUI             |
| `Reel.tsx`             | リールの描画・回転・停止・演出       |
| `BetControls.tsx`      | ベット額の調整UI                     |
| `HistoryPanel.tsx`     | 履歴と絵柄ランキング表示             |
| `usePurchaseLimit.ts`  | 残高購入制限ロジック                  |
| `AudioController.ts`   | 音声再生ユーティリティ               |
| `Reel.css`             | リールの見た目とアニメーション       |
| `SlotMachine.css`      | ゲーム全体のレイアウトと共通スタイル |

---

### 11. 拡張のアイデア 💡
- 🎵 音量調整スライダーの追加
- 🎨 絵柄ごとのアニメーション演出
- 🏆 スコアランキング機能（ローカル or サーバー連携）
- 🔁 オートスピン機能
- 🎧 音声コントローラーの導入（音が増えたら）
- 🧭 絵柄図鑑・コレクション
- 🕒 日替わりイベント・季節演出