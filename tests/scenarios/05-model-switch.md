# Scenario 05: Model Switch (モデル切り替え E2E)

## 目的

`ModelMenu.selectModel(NominalModelQuery)` の **エンドツーエンドのフロー** を検証する:

- `#openList` → メニューを開く
- `#selectItem` → `modelListLabel.textContent` を列挙し、`NominalModelQuery#equalsModel`（`normalizeModelName` で正規化）でマッチしたボタンを `click()`
- 切り替え後の `currentModelLabel` が `NominalModelQuery#matchesCurrent` で target と一致することを確認

01-baseline でセレクタ単体の解決を、02-model-list でメニュー展開後の要素列挙までを確認している。本シナリオはその先の **クリック選択と切替反映** を埋める。

## 検証対象セレクタ ID

- `currentModelLabel` (切替前後の取得)
- `modelMenuButton` (メニュー開閉)
- `modelListButton`, `modelListLabel` (target 列挙とラベル抽出)

## 検証対象ロジック

- `normalizeModelName` (`src/shared/core/model-query.ts`): 括弧内除去・小文字化・空白除去
- `NominalModelQuery#matchesCurrent`: 現在モデルラベルの短縮表記 (`"Flash"`) とメニューのフル表記 (`"3.5 Flash"`) を、バージョン番号プレフィックスを除いて一致判定 (equalsQuery より緩い「切替後確認」用)
- `ModelMenu.selectModel` 全体フロー (`OperationCanceledError` を握り潰す挙動を含む)

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

8. **メニューを閉じる** (selectModel 内で再度 `#openList` が走るため、いったん閉じておくと UI 状態が素直):
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
      "async () => { const after = await window.__t.modelSelector.getCurrentModelQuery(); const target = new window.__t.NominalModelQuery(window.__target); return { before: window.__before, after: after.name, target: window.__target, switched: after.name !== window.__before, matchesTarget: target.matchesCurrent(after) }; }"
    })
    ```
    - 注: 検証は `after.equalsQuery(target)` ではなく **`target.matchesCurrent(after)`** を使う。`currentModelLabel` は短縮表記 (`"Flash"`) のことがあり、`equalsQuery` の厳密一致ではフル表記の target (`"3.5 Flash"`) と一致しない。`matchesCurrent` はバージョン番号プレフィックスを除いて比較する (かつて既知バグだったが修正済み — SKILL.md §5.6 参照)。

12. **URL 生成の round-trip 検証** (`getSelectedModelQuery` → `ext-m` → 別モデルへ切替 → 生成 URL で再選択):
    ```
    mcp__playwright__browser_evaluate({ function:
      "async () => { const M = window.__t; const q = await M.modelSelector.getSelectedModelQuery(); const startId = q.getIdentifierString(); const headerId = (await M.modelSelector.getCurrentModelQuery()).getIdentifierString(); const url = M.QueryParameter.generate({ modelQuery: q }).buildUrl(window.location); const extM = new URLSearchParams(new URL(url).hash.slice(1)).get('ext-m'); const btn = await M.selectorService.getElement('modelMenuButton'); btn.click(); await new Promise(r => setTimeout(r, 800)); const names = []; for (const b of await M.selectorService.getElements('modelListButton')) { const l = b.querySelector(M.selectors.modelListLabel.selector); if (l) names.push(l.textContent.trim()); } btn.click(); await new Promise(r => setTimeout(r, 500)); const other = names.find(n => new M.NominalModelQuery(n).getIdentifierString() !== startId); await M.modelSelector.selectModel(new M.NominalModelQuery(other)); await new Promise(r => setTimeout(r, 1500)); const midId = (await M.modelSelector.getSelectedModelQuery()).getIdentifierString(); const parsed = M.QueryParameter.generateFromUrl(url).getModelQuery(); await M.modelSelector.selectModel(parsed); await new Promise(r => setTimeout(r, 1500)); const backId = (await M.modelSelector.getSelectedModelQuery()).getIdentifierString(); return { startId, headerId, extM, midId, backId, carriesFullLabel: extM === startId, switchedAway: midId !== startId, roundTrips: backId === extM }; }"
    })
    ```
    - `getSelectedModelQuery` はメニューを一瞬開いて選択中項目 (`.selected`) のフルラベルを読み、閉じる (実行中にドロップダウンが開閉する)。
    - **round-trip の判定は `getSelectedModelQuery().getIdentifierString()` (選択中項目のフルラベル) 同士で比較する。** ヘッダ基準の `matchesCurrent` は使わない — 思考モードはヘッダが `"思考モード"`、項目が `"3.6 Thinking"` で対応が無く、選択に成功しても `matchesCurrent` は false を返すため round-trip の判定に使えない。
    - 期待: `carriesFullLabel: true` (URL の `ext-m` が項目フルラベル由来。例 `"3.1pro"` / `"3.6thinking"`)、`switchedAway: true` (別モデルへ確実に離れた)、`roundTrips: true` (生成 URL をパースし直して `selectModel` → 元の項目へ戻る)。
    - `startId` (項目フル: 例 `"3.6thinking"`) と `headerId` (ヘッダ短縮/ローカライズ: 例 `"思考モード"`) は異なりうる。**旧実装は `headerId` を `ext-m` にしていたため項目照合 (`equalsModel`) に一致せず、特に思考モードは全く選択できなかった。** 本ステップはその修正を固定する。

## 期待結果

ステップ 11 の返り値が:
- `switched: true` (`before` と `after` が異なる)
- `matchesTarget: true` (`target.matchesCurrent(after)` が true — 現在ラベルが短縮表記でもバージョン番号プレフィックスを除いた一致判定が効いている)

ステップ 12 の返り値が:
- `carriesFullLabel: true` (`ext-m` が選択中項目のフルラベル由来)
- `switchedAway: true` (再選択前に別モデルへ離脱できている)
- `roundTrips: true` (生成 URL → パース → `selectModel` で元の項目へ戻る。選択中項目ラベルで判定)

## 失敗時の対応

- **`switched: false`** (切替が反映されていない)
  - `mcp__playwright__browser_snapshot()` で DOM を確認し、メニューが開いたままになっていないか、target ボタンが画面外でクリックが効いていないか確認
  - `selectModel` は `OperationCanceledError` を握り潰すため、ステップ 9 を以下に置き換えて内部状態を直接確認:
    ```
    "async () => { const buttons = await window.__t.selectorService.getElements('modelListButton'); for (const b of buttons) { const lab = b.querySelector(window.__t.selectors.modelListLabel.selector); if (lab && lab.textContent.trim().toLowerCase().replace(/\\s+/g,'') === window.__target.toLowerCase().replace(/\\s+/g,'')) return 'match-found'; } return 'no-match'; }"
    ```
  - 上で `no-match` が返るなら、ラベルに括弧表記（例 `"Fast (新)"`）が混じっている可能性。`src/shared/core/model-query.ts` の `normalizeModelName` の挙動を再確認

- **`matchesTarget: false` だが `switched: true`**
  - 切替自体は起きたが target と異なるモデルが選ばれた
  - ステップ 7 の `names` 列挙順とラベル取得が正しいか、`modelListLabel` セレクタが各 `modelListButton` 内で重複ヒットしていないかを `browser_snapshot()` で確認

- **ステップ 6 の `before` が空文字**
  - 01-baseline と同じ失敗 — `currentModelLabel` セレクタが壊れている可能性。`src/shared/config/selectors.json` のエントリと現行 DOM の差分を `browser_snapshot()` で提示

修正案を提示するに留め、`src/shared/config/selectors.json` の書き換えは行わない (ユーザ判断)。
