# Scenario 01: Baseline (起動直後の常時表示要素)

## 目的
Gemini チャット画面を開いただけで参照可能な「最低限の UI 要素」を、`ElementLocator` (互換シム `selectorService.getElement(id)`) で解決できるか確認する。

## 検証対象セレクタ ID
- `textareaContainer` (プロンプト入力欄)
- `sendButton` (送信ボタン — Gemini のクラス `.stop` 切替に依存。**テキストエリアが空だと DOM に存在しない**)
- `modelMenuButton` (モデル切替ボタン)
- `currentModelLabel` (現在モデル名の表示ラベル)

## 前提
- Google アカウントでログイン済み (`.playwright-user-data/` にセッションあり)

## 手順 (Claude が MCP で実行)

1. `tests/dist/inject-bundle.js` の中身を `Read` で取得 (変数 `BUNDLE_SRC` として保持)
2. `mcp__playwright__browser_navigate({ url: "https://gemini.google.com/app" })`
3. `mcp__playwright__browser_wait_for({ text: "Gemini", time: 8 })` — タイトル/ヘッダが現れるまで
4. `mcp__playwright__browser_evaluate({ function: \`() => { ${BUNDLE_SRC}; return typeof __geminiSelectorTest; }\` })`
   - 期待結果: `"object"`
5. `mcp__playwright__browser_evaluate({ function: "async () => { window.__t = await __geminiSelectorTest.bootstrap(); return Object.keys(window.__t); }" })`
6. **テキストエリアにテキストを投入** (`sendButton` はテキスト未入力だと DOM に存在せず、マイクボタンのみになるため):
   `mcp__playwright__browser_evaluate({ function: "async () => { await window.__t.textarea.setPrompt('hi'); return 'typed'; }" })`
7. `mcp__playwright__browser_evaluate({ function: "() => window.__t.probeAll(['textareaContainer','sendButton','modelMenuButton','currentModelLabel'])" })`

## 期待結果

4 要素すべて `found: true`、`tag` が `DIV`/`BUTTON`/`SPAN` 等の妥当な値であること。

## 失敗時の対応

`found: false` のセレクタがあれば:
- `sendButton` の場合はまずステップ 6 のテキスト投入が済んでいるか確認 (未入力だと存在しないのが正常)
- `mcp__playwright__browser_snapshot()` で現在 DOM を取得し、本来そこにあるはずのボタンが別クラス名で存在していないか確認
- `src/shared/config/selectors.json` のエントリと差分を提示
- 修正案を出すが、書き換えは行わない (ユーザ判断)
