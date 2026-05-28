# Scenario 05: Model Switch (モデル切り替え E2E)

## 目的

`ModelSelector.selectModel(NominalModelQuery)` の **エンドツーエンドのフロー** を検証する:

- `#openModelList` → メニューを開く
- `#findModelListButton` → `modelListLabel.textContent` を `NominalModelQuery#equalsModel`（`#normalizeModelName` で正規化）でマッチ
- `#selectModelItem` → 一致したボタンを `click()`
- 切り替え後の `currentModelLabel` が target モデル名と等価になることを確認

01-baseline でセレクタ単体の解決を、02-model-list でメニュー展開後の要素列挙までを確認している。本シナリオはその先の **クリック選択と切替反映** を埋める。

## 検証対象セレクタ ID

- `currentModelLabel` (切替前後の取得)
- `modelMenuButton` (メニュー開閉)
- `modelListButton`, `modelListLabel` (target 列挙とラベル抽出)

## 検証対象ロジック

- `NominalModelQuery#normalizeModelName`: 括弧内除去・小文字化・空白除去
- `ModelSelector.selectModel` 全体フロー (`OperationCanceledError` を握り潰す挙動を含む)

## 前提

- Google アカウントでログイン済み (`.playwright-user-data/` にセッションあり)
- Gemini の現在アカウントでモデル選択肢が **2 つ以上** 存在する

## 手順 (Claude が MCP で実行)

1〜5. Scenario 01 と同じ準備 (bundle 注入 + bootstrap)

6. **切替前のモデル名を取得**:
   ```
   mcp__playwright__browser_evaluate({ function:
     "async () => { const q = await window.__t.modelSelector.getCurrentModelQuery(); window.__before = q.name; return window.__before; }"
   })
   ```
   - 期待: 空文字でないモデル名 (例: `"Fast"`)

7. **メニューを開いて target モデル名を選定**:
   ```
   mcp__playwright__browser_evaluate({ function:
     "async () => { const btn = await window.__t.selectorService.getElement('modelMenuButton'); btn.click(); return 'opened'; }"
   })
   ```
   ```
   mcp__playwright__browser_wait_for({ time: 1 })
   ```
   ```
   mcp__playwright__browser_evaluate({ function:
     "async () => { const buttons = await window.__t.selectorService.getElements('modelListButton'); const names = []; for (const b of buttons) { const lab = b.querySelector(window.__t.selectors.modelListLabel.selector); if (lab) names.push(lab.textContent.trim()); } const target = names.find(n => n && n !== window.__before); window.__target = target; return { names, target }; }"
   })
   ```
   - 期待: `names` に 2 つ以上のエントリ、`target` が `before` と異なる文字列

8. **メニューを閉じる** (selectModel 内で再度 `#openModelList` が走るため、いったん閉じておくと UI 状態が素直):
   ```
   mcp__playwright__browser_evaluate({ function:
     "async () => { const btn = await window.__t.selectorService.getElement('modelMenuButton'); btn.click(); return 'closed'; }"
   })
   ```
   ```
   mcp__playwright__browser_wait_for({ time: 1 })
   ```

9. **`selectModel` を実行**:
   ```
   mcp__playwright__browser_evaluate({ function:
     "async () => { const q = new window.__t.NominalModelQuery(window.__target); await window.__t.modelSelector.selectModel(q); return 'invoked'; }"
   })
   ```
   - `OperationCanceledError` が内部で握り潰される設計なので、ここで例外は飛ばない想定。値が返らない場合は失敗時欄を参照。

10. **UI 反映待ち**:
    ```
    mcp__playwright__browser_wait_for({ time: 2 })
    ```

11. **切替後のモデル名を確認**:
    ```
    mcp__playwright__browser_evaluate({ function:
      "async () => { const after = await window.__t.modelSelector.getCurrentModelQuery(); const target = new window.__t.NominalModelQuery(window.__target); return { before: window.__before, after: after.name, target: window.__target, switched: after.name !== window.__before, matchesTarget: after.equalsQuery(target) }; }"
    })
    ```

## 期待結果

ステップ 11 の返り値が:
- `switched: true` (`before` と `after` が異なる)
- `matchesTarget: true` (`after` が `target` と `NominalModelQuery` 上で等価 — 正規化マッチが効いている)

## 失敗時の対応

- **`switched: false`** (切替が反映されていない)
  - `mcp__playwright__browser_snapshot()` で DOM を確認し、メニューが開いたままになっていないか、target ボタンが画面外でクリックが効いていないか確認
  - `selectModel` は `OperationCanceledError` を握り潰すため、ステップ 9 を以下に置き換えて内部状態を直接確認:
    ```
    "async () => { const buttons = await window.__t.selectorService.getElements('modelListButton'); for (const b of buttons) { const lab = b.querySelector(window.__t.selectors.modelListLabel.selector); if (lab && lab.textContent.trim().toLowerCase().replace(/\\s+/g,'') === window.__target.toLowerCase().replace(/\\s+/g,'')) return 'match-found'; } return 'no-match'; }"
    ```
  - 上で `no-match` が返るなら、ラベルに括弧表記（例 `"Fast (新)"`）が混じっている可能性。`extension/js/models/model-query.js` の `#normalizeModelName` の挙動を再確認

- **`matchesTarget: false` だが `switched: true`**
  - 切替自体は起きたが target と異なるモデルが選ばれた
  - ステップ 7 の `names` 列挙順とラベル取得が正しいか、`modelListLabel` セレクタが各 `modelListButton` 内で重複ヒットしていないかを `browser_snapshot()` で確認

- **ステップ 6 の `before` が空文字**
  - 01-baseline と同じ失敗 — `currentModelLabel` セレクタが壊れている可能性。`extension/res/selectors.json` のエントリと現行 DOM の差分を `browser_snapshot()` で提示

修正案を提示するに留め、`extension/res/selectors.json` の書き換えは行わない (ユーザ判断)。
