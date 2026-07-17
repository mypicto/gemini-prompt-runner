# Scenario 06: Model Fallback (モデル指定のフォールバック)

## 目的

`ext-m` のカンマ区切り複数候補指定 (`FallbackModelQuery`) を検証する:

- `QueryParameter.#processModel` のパース: 単一整数 → `IdentifierModelQuery`、カンマ区切り → `FallbackModelQuery`
- `FallbackModelQuery.findModel` の **候補順優先** マッチ (CSS `font-family` と同じ挙動)
- 存在しない候補のスキップと実在候補へのフォールバック
- 全候補不一致時に `OperationCanceledError` が握り潰され現在モデルが不変であること
- `toJSON` → `generateFromJson` → `buildUrl` のラウンドトリップ

05-model-switch が単一 `NominalModelQuery` のリグレッションを担い、本シナリオはフォールバック固有の挙動を担う。

## 検証対象セレクタ ID

- `currentModelLabel` (切替前後の取得)
- `modelMenuButton`, `modelListButton`, `modelListLabel` (メニュー列挙)

## 検証対象ロジック

- `FallbackModelQuery` (`extension/js/models/model-query.js`): `findModel` / `equalsQuery` / `getIdentifierString`
- `QueryParameter.#processModel` のカンマ分割 (`extension/js/utils/query-parameter.js`)
- `ModelSelector.#findModelListButton` の全列挙 + `findModel` 委譲

## 前提

- Google アカウントでログイン済み (`.playwright-user-data/` にセッションあり)
- Gemini の現在アカウントでモデル選択肢が **2 つ以上** 存在する

## 手順 (Claude が MCP で実行)

1〜5. Scenario 01 と同じ準備 (bundle 注入 + bootstrap)

6. **パース/ラウンドトリップ検証** (DOM 非依存なので先に実施):
   ```
   mcp__playwright__browser_evaluate({ function:
     "() => { const QP = window.__t.QueryParameter; const FQ = window.__t.FallbackModelQuery; const NQ = window.__t.NominalModelQuery; const r = {}; const p1 = QP.generateFromUrl('https://gemini.google.com/app#ext-m=Alpha%20One,Beta'); r.fallbackParsed = p1.getModelQuery() instanceof FQ; r.identifier = p1.getModelQuery().getIdentifierString(); const j = p1.toJSON(); r.jsonModel = j.modelQuery; const p2 = QP.generateFromJson(j); r.roundtripEqual = p2.getModelQuery().equalsQuery(p1.getModelQuery()); r.builtUrl = p2.buildUrl(new URL('https://gemini.google.com/app')); const p3 = QP.generateFromUrl('https://gemini.google.com/app#ext-m=3'); r.integerIsIdentifier = !(p3.getModelQuery() instanceof NQ) && !(p3.getModelQuery() instanceof FQ); const p4 = QP.generateFromUrl('https://gemini.google.com/app#ext-m=3,Flash'); r.mixedIsFallback = p4.getModelQuery() instanceof FQ; const p5 = QP.generateFromUrl('https://gemini.google.com/app#ext-m=,,'); r.emptyIsNull = p5.getModelQuery() === null; return r; }"
   })
   ```
   - 期待:
     - `fallbackParsed: true`
     - `identifier: "alphaone,beta"` (正規化: 小文字化 + 空白除去)
     - `jsonModel: "alphaone,beta"`
     - `roundtripEqual: true`
     - `builtUrl` に `ext-m=alphaone%2Cbeta` が含まれる
     - `integerIsIdentifier: true` (単一整数はフォールバック非対応)
     - `mixedIsFallback: true` (カンマを含めば数値要素も名称扱い)
     - `emptyIsNull: true`

7. **切替前のモデル名を取得**:
   ```
   mcp__playwright__browser_evaluate({ function:
     "async () => { const q = await window.__t.modelSelector.getCurrentModelQuery(); window.__before = q.name; return window.__before; }"
   })
   ```
   - 期待: 空文字でないモデル名

8. **メニューを開いて target モデル名を選定** (Scenario 05 の手順 7 と同じ):
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

9. **メニューを閉じる**:
   ```
   mcp__playwright__browser_evaluate({ function:
     "async () => { const btn = await window.__t.selectorService.getElement('modelMenuButton'); btn.click(); return 'closed'; }"
   })
   ```
   ```
   mcp__playwright__browser_wait_for({ time: 1 })
   ```

10. **フォールバック選択を実行** (先頭候補は存在しない名前):
    ```
    mcp__playwright__browser_evaluate({ function:
      "async () => { const q = new window.__t.FallbackModelQuery([new window.__t.NominalModelQuery('NonexistentModelXYZ'), new window.__t.NominalModelQuery(window.__target)]); await window.__t.modelSelector.selectModel(q); return 'invoked'; }"
    })
    ```
    ```
    mcp__playwright__browser_wait_for({ time: 2 })
    ```

11. **切替後のモデル名を確認**:
    ```
    mcp__playwright__browser_evaluate({ function:
      "async () => { const after = await window.__t.modelSelector.getCurrentModelQuery(); const target = new window.__t.NominalModelQuery(window.__target); return { before: window.__before, after: after.name, target: window.__target, switched: after.name !== window.__before, matchesTarget: after.equalsQuery(target) }; }"
    })
    ```
    - 期待: `switched: true`, `matchesTarget: true` (存在しない先頭候補をスキップし 2 番目の候補が選ばれた)

12. **候補順優先を確認** (元のモデルと target を両方候補に、元のモデルを先頭に):
    ```
    mcp__playwright__browser_evaluate({ function:
      "async () => { const q = new window.__t.FallbackModelQuery([new window.__t.NominalModelQuery(window.__before), new window.__t.NominalModelQuery(window.__target)]); await window.__t.modelSelector.selectModel(q); return 'invoked'; }"
    })
    ```
    ```
    mcp__playwright__browser_wait_for({ time: 2 })
    ```
    ```
    mcp__playwright__browser_evaluate({ function:
      "async () => { const after = await window.__t.modelSelector.getCurrentModelQuery(); const first = new window.__t.NominalModelQuery(window.__before); return { after: after.name, matchesFirstCandidate: after.equalsQuery(first) }; }"
    })
    ```
    - 期待: `matchesFirstCandidate: true` (両候補ともメニューに実在するが、**先頭候補** が選ばれる)

13. **全候補不一致でモデル不変を確認**:
    ```
    mcp__playwright__browser_evaluate({ function:
      "async () => { const beforeQ = await window.__t.modelSelector.getCurrentModelQuery(); const q = new window.__t.FallbackModelQuery([new window.__t.NominalModelQuery('NonexistentAAA'), new window.__t.NominalModelQuery('NonexistentBBB')]); await window.__t.modelSelector.selectModel(q); const afterQ = await window.__t.modelSelector.getCurrentModelQuery(); return { unchanged: beforeQ.equalsQuery(afterQ), noThrow: true }; }"
    })
    ```
    ```
    mcp__playwright__browser_wait_for({ time: 1 })
    ```
    - 期待: `unchanged: true`, `noThrow: true` (`OperationCanceledError` が握り潰される)
    - 注意: メニューが開いたまま残る場合があるので、後続作業があれば `modelMenuButton` クリックか `Escape` キーで閉じる

## 期待結果

- ステップ 6: パース/ラウンドトリップの全項目が期待値通り
- ステップ 11: `switched: true`, `matchesTarget: true`
- ステップ 12: `matchesFirstCandidate: true`
- ステップ 13: `unchanged: true`

## 失敗時の対応

- **ステップ 6 で `fallbackParsed: false` など**
  - `tests/dist/inject-bundle.js` が古い可能性。`cd tests && npm run build` で再ビルドして再注入
- **ステップ 11 で `switched: false`**
  - Scenario 05 の失敗時の対応と同じ手順で `modelListButton` / `modelListLabel` の解決を確認
  - `ModelSelector.#findModelListButton` は全ボタンのラベルを列挙してから `findModel` に委譲するため、ラベル欠落ボタンは console.debug でスキップされる。`browser_console_messages` でログを確認
- **ステップ 12 で `matchesFirstCandidate: false`**
  - `FallbackModelQuery.findModel` の候補順ループが崩れている可能性 (メニュー順が優先されてしまうバグ)。`extension/js/models/model-query.js` を確認
- **ステップ 13 で `unchanged: false`**
  - 存在しないはずの名前が正規化で実在モデルと衝突している可能性。候補名をよりランダムな文字列に変えて再実行

修正案を提示するに留め、`extension/res/selectors.json` の書き換えは行わない (ユーザ判断)。
