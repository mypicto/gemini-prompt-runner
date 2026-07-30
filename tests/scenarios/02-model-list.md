# Scenario 02: Model List (モデルメニュー展開後の要素)

## 目的
モデル切替メニューを開いた後にのみ DOM に現れる要素を確認する。`ModelMenu#selectModel` の前段で必要なセレクタ群。

## 検証対象セレクタ ID
- `modelListButton` (各モデル選択肢)
- `modelListLabel` (モデル名ラベル — `modelListButton` 内)
- `modelListSelectedItem` (現在選択中の項目 — `.selected` クラス付き。URL 生成でフルラベルを読む出所)

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

8. **modelListButton / modelListLabel / modelListSelectedItem を probe**:
   ```
   mcp__playwright__browser_evaluate({ function:
     "() => window.__t.probeAll(['modelListButton','modelListLabel','modelListSelectedItem'])"
   })
   ```

9. **(オプション) 各モデルラベル名を一覧で取る**:
   ```
   mcp__playwright__browser_evaluate({ function:
     "async () => { const buttons = await window.__t.selectorService.getElements('modelListButton'); const out = []; for (const b of buttons) { const lab = b.querySelector(window.__t.selectors.modelListLabel.selector); out.push(lab ? lab.textContent.trim() : null); } return out; }"
   })
   ```

10. **選択中項目のフルラベルがヘッダの短縮表記と異なることを確認** (URL 生成の要):
    ```
    mcp__playwright__browser_evaluate({ function:
      "async () => { const sel = await window.__t.selectorService.getElement('modelListSelectedItem'); const full = sel.querySelector(window.__t.selectors.modelListLabel.selector).textContent.trim(); const header = (await window.__t.modelSelector.getCurrentModelQuery()).name; return { full, header, differs: full !== header }; }"
    })
    ```
    - 期待: `full` が項目のフル表記 (例 `"3.1 Pro"` / `"3.6 Thinking"`)、`header` が短縮/ローカライズ表記 (例 `"Pro"` / `"思考モード"`)。多くのモデルで `differs: true`

## 期待結果

- `modelListButton`: `found: true`、複数要素が存在
- `modelListLabel`: `found: true`、最初のラベルが取得できる
- `modelListSelectedItem`: `found: true`、選択中の 1 項目のみ (`.selected`)
- (オプション) モデル名一覧 (例: `["3.6 Flash", "3.6 Thinking", "3.1 Pro"]`) が取れる
- ステップ 10: 選択中項目のフルラベルが取得でき、ヘッダの短縮表記と (多くの場合) 異なる

## 失敗時

- メニューが閉じていないか `browser_snapshot()` で確認
- モデルメニューボタンのクリックハンドラが Gemini 側で変わっていないか調査
