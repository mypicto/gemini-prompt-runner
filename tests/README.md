# Selector Unit Tests via Playwright MCP

このディレクトリは `src/content/page/element-locator.ts` 周辺の「オブジェクト参照」ロジックを実 Gemini ページ (`https://gemini.google.com/`) に対して検証するためのテスト基盤です。検証は Claude Code + Playwright MCP を使い、Claude が対話的にブラウザ操作 → bundle 注入 → 各セレクタの解決可否を確認する形で実施します。

## 仕組み

1. `src/inject-entry.ts` が本番モジュール (`ElementLocator`, `ModelMenu`, `SendButton` 等の `src/content/page/*` と `src/shared/*`) を `chrome.runtime` / `chrome.storage` への依存無し (`MemorySelectorRepository`) で構築し、`window.__geminiSelectorTest` にぶら下げる
2. `build-bundle.mjs` が esbuild で IIFE 形式の単一ファイル `dist/inject-bundle.js` を生成 (約 27〜28KB)
3. Claude が Playwright MCP の `browser_evaluate` 経由でこのバンドルをページに注入する (`page.evaluate` は Gemini の CSP を回避できる)
4. 注入後、`window.__geminiSelectorTest.probe(id)` 等を呼び出して結果を取得

`bootstrap()` は新 API の `locator` (`find` / `findAll` / `exists`) に加え、旧シナリオ手順互換のシム `selectorService` (`getElement` / `getElements` / `existsElement`) も公開します。

## セットアップ

```bash
# リポジトリルートで
npm install
npm run build:inject   # → tests/dist/inject-bundle.js
```

依存 (`esbuild` 等) はルートの `package.json` に統合されています (`tests/package.json` は廃止)。

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
| `scenarios/02-model-list.md` | `modelListButton`, `modelListLabel`, `modelListSelectedItem` | ログイン済み + モデルメニュー展開 |
| `scenarios/03-copy-menu.md` | `copyButton` | プロンプト送信 → 応答完了後 |
| `scenarios/04-login-link.md` | `serviceLoginLink` | **未ログイン** 状態 (別 user-data-dir または incognito) |
| `scenarios/05-model-switch.md` | `ModelMenu.selectModel` フロー全体 + `NominalModelQuery` 名称正規化/`matchesCurrent` + 切替後 `currentModelLabel` の変化 + `getSelectedModelQuery` の URL round-trip | ログイン済 + モデル選択肢が 2 つ以上 |
| `scenarios/06-model-fallback.md` | `FallbackModelQuery` の候補順フォールバック + `QueryParameter` のカンマ区切りパース/ラウンドトリップ | ログイン済 + モデル選択肢が 2 つ以上 |

各シナリオの Markdown には Claude が実行すべき MCP コマンドの並びが書いてあります。Claude に「`tests/scenarios/01-baseline.md` を実行して」と指示するだけで、navigate → 注入 → probe → 結果報告 まで一気通貫で行います。

## バンドルの再ビルド

`src/content/page/`, `src/shared/` (特に `src/shared/config/selectors.json`), `tests/src/` のいずれかを編集したら必ずリポジトリルートで `npm run build:inject` を実行してください。
