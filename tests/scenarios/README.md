# Selector Verification Scenarios

各シナリオは、Claude が Playwright MCP 経由で実行する playbook です。Markdown 内に書かれた手順を Claude が順に実行し、最後に各セレクタの解決結果を一覧で報告します。

## 共通プロローグ

すべてのシナリオは以下の流れで始まります:

1. **バンドル準備**: `tests/dist/inject-bundle.js` を read で読み込む (Claude が `Read` tool で取得)
2. **ナビゲート**: `mcp__playwright__browser_navigate` で `https://gemini.google.com/` を開く (シナリオ 04 のみ未ログイン用に別 user-data-dir)
3. **ページ読込み待ち**: `mcp__playwright__browser_wait_for` で main UI が表示されるまで待つ
4. **バンドル注入**: `mcp__playwright__browser_evaluate` に bundle のソースを文字列で渡して評価
5. **bootstrap 呼び出し**: もう一度 `browser_evaluate` で
   ```js
   () => __geminiSelectorTest.bootstrap().then(api => { window.__t = api; return 'ok'; })
   ```
   を実行 (注: `bootstrap` は Promise を返すため evaluate 内で await する)
6. **以降**: `window.__t.probe(id)` / `window.__t.probeAll()` などを `browser_evaluate` で呼び、結果を JSON で受け取る

## 共通エピローグ

各シナリオの最後に Claude は以下の形でレポートを出します:

```
| selector id | found | tag | visible | error |
| --- | --- | --- | --- | --- |
| textareaContainer | ✅ | DIV | yes | - |
| sendButton | ❌ | - | - | Timeout: ... |
```

失敗が出たら、Claude は対応する `src/shared/config/selectors.json` のエントリと、Playwright スナップショット (`browser_snapshot`) で見えている実 DOM を突き合わせて、想定セレクタの修正案を提示します。
