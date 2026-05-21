# Selector Unit Tests via Playwright MCP

このディレクトリは `extension/js/services/selector-service.js` 周辺の「オブジェクト参照」ロジックを実 Gemini ページ (`https://gemini.google.com/`) に対して検証するためのテスト基盤です。検証は Claude Code + Playwright MCP を使い、Claude が対話的にブラウザ操作 → bundle 注入 → 各セレクタの解決可否を確認する形で実施します。

## 仕組み

1. `src/inject-entry.js` が本番モジュール (`SelectorService`, `ModelSelector`, `SendButton` 等) を `chrome.runtime` / `chrome.storage` への依存無しで構築し、`window.__geminiSelectorTest` にぶら下げる
2. `build-bundle.mjs` が esbuild で IIFE 形式の単一ファイル `dist/inject-bundle.js` を生成
3. Claude が Playwright MCP の `browser_evaluate` 経由でこのバンドルをページに注入する (`page.evaluate` は Gemini の CSP を回避できる)
4. 注入後、`window.__geminiSelectorTest.probe(id)` 等を呼び出して結果を取得

本番コード側の変更点は `SelectorDomainService` / `SelectorService` の constructor を引数オプション化 (DI) しただけで、既存呼び出し (`new SelectorService()`) は無変更で動作します。

## セットアップ

```bash
cd tests
npm install
npm run build   # → tests/dist/inject-bundle.js
```

Playwright MCP は `.mcp.json` で登録済み。Claude Code を再起動すると `mcp__playwright__browser_*` が利用可能になります。初回起動時に Chromium のダウンロードが走ります。

## 初回ログイン

Gemini はログインが必要なため、`.playwright-user-data/` (`.gitignore` 対象) に永続セッションを残します。

1. Claude に「Playwright で gemini.google.com を開いて」と指示
2. ブラウザが開いたら手動で Google アカウントにログイン
3. セッションが保存され、以降のテストはログイン済み状態から始まる

## シナリオ

| ファイル | 検証対象 | 前提 |
| --- | --- | --- |
| `scenarios/01-baseline.md` | `textareaContainer`, `sendButton`, `modelMenuButton`, `currentModelLabel` | ログイン済み・通常チャット画面 |
| `scenarios/02-model-list.md` | `modelListButton`, `modelListLabel` | ログイン済み + モデルメニュー展開 |
| `scenarios/03-copy-menu.md` | `moreMenuButton`, `copyButton` | プロンプト送信 → 応答完了後 |
| `scenarios/04-login-link.md` | `serviceLoginLink` | **未ログイン** 状態 (別 user-data-dir または incognito) |
| `scenarios/05-model-switch.md` | `ModelSelector.selectModel` フロー全体 + `NominalModelQuery` 名称正規化 + 切替後 `currentModelLabel` の変化 | ログイン済 + モデル選択肢が 2 つ以上 |

各シナリオの Markdown には Claude が実行すべき MCP コマンドの並びが書いてあります。Claude に「`tests/scenarios/01-baseline.md` を実行して」と指示するだけで、navigate → 注入 → probe → 結果報告 まで一気通貫で行います。

## バンドルの再ビルド

`extension/js/services/`, `extension/js/components/`, `extension/res/selectors.json`, `tests/src/` のいずれかを編集したら必ず `npm run build` を実行してください。
