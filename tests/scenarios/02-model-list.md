# Scenario 02: Model List (モデルメニュー展開後の要素)

## 目的
モデル切替メニューを開いた後にのみ DOM に現れる要素を確認する。`ModelSelector#selectModel` の前段で必要なセレクタ群。

## 検証対象セレクタ ID
- `modelListButton` (各モデル選択肢)
- `modelListLabel` (モデル名ラベル — `modelListButton` 内)

## 前提
- Scenario 01 と同じく Google アカウントログイン済み
- Scenario 01 の bootstrap 済みであればステップ 1〜4 はスキップ可

## 手順

1〜5. Scenario 01 と同じ準備 (bundle 注入 + bootstrap)

6. **モデルメニューを開く**:
   ```
   mcp__playwright__browser_evaluate({ function:
     "async () => { const btn = await window.__t.selectorService.getElement('modelMenuButton'); btn.click(); return 'clicked'; }"
   })
   ```

7. UI 安定待ち (約 500ms):
   ```
   mcp__playwright__browser_wait_for({ time: 1 })
   ```

8. **modelListButton / modelListLabel を probe**:
   ```
   mcp__playwright__browser_evaluate({ function:
     "() => window.__t.probeAll(['modelListButton','modelListLabel'])"
   })
   ```

9. **(オプション) 各モデルラベル名を一覧で取る**:
   ```
   mcp__playwright__browser_evaluate({ function:
     "async () => { const buttons = await window.__t.selectorService.getElements('modelListButton'); const out = []; for (const b of buttons) { const lab = b.querySelector(window.__t.selectors.modelListLabel.selector); out.push(lab ? lab.textContent.trim() : null); } return out; }"
   })
   ```

## 期待結果

- `modelListButton`: `found: true`、複数要素が存在
- `modelListLabel`: `found: true`、最初のラベルが取得できる
- (オプション) モデル名一覧 (例: `["Fast", "Thinking", ...]`) が取れる

## 失敗時

- メニューが閉じていないか `browser_snapshot()` で確認
- モデルメニューボタンのクリックハンドラが Gemini 側で変わっていないか調査
