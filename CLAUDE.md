# CLAUDE.md

## プロジェクト概要

URL介してGeminiWebアプリでプロンプトを実行するChrome拡張機能。
URL パラメータ (`ext-q`, `ext-m`, `ext-clipboard`, `ext-send`, `ext-required-login`) を
フラグメント形式 (`#key=value`) で受け取り、Gemini Web 上でプロンプト投入・モデル選択・自動送信を行う。

## 技術スタック

- 言語: TypeScript (strict)、HTML、CSS
- プラットフォーム: Chrome 拡張 Manifest V3
- ビルド: esbuild (`build.mjs`) でエントリごとにバンドル → `dist/` に出力
- テスト: Vitest (単体 + 契約テスト)、Playwright MCP (実 Gemini でのセレクタ/E2E 検証)
- lint: ESLint (アーキテクチャ規約の強制のみ。スタイルは扱わない)

## ディレクトリ構成

- `src/` — TypeScript ソース。実行コンテキストごとにディレクトリを分ける
  - `background/` `content/` `popup/` `options/` — 各エントリ。`main.ts` が composition root
  - `content/page/` — Gemini DOM のページオブジェクト (セレクタ ID しか知らない)
  - `shared/config/` — **単一情報源**: `selectors.json` (Gemini セレクタ)、`ext-params.ts`、
    `timing.ts` (全タイムアウト)、`urls.ts`、`icons.ts`
  - `shared/protocol/` — 型付きメッセージ契約 (`ProtocolMap`) と受信ルータ
  - `shared/platform/` — chrome.*/browser API の Port 境界 (ここ以外で chrome を触らない)
  - `shared/core/` — 純粋ドメイン (`QueryParameter`, `ModelQuery`)。chrome/DOM 依存ゼロ
  - 単体テストはソース同居 (`*.test.ts`)
- `public/` — 静的アセット (manifest.json, rules.json, html/, css/, images/, _locales/, res/)。
  ビルド時に `dist/` へそのままコピーされる
- `dist/` — ビルド出力 (gitignore)。**chrome://extensions で読み込むのはここ**
- `tests/` — Playwright MCP シナリオ (`scenarios/*.md`) と契約テスト (`contract/`)
- `docs/` — GitHub Pages のリダイレクトページ (`mypicto.github.io/gemini-prompt-runner`)
- `tools/mac/` — Mac Shortcuts 連携用サンプル
- `store/` — Chrome Web Store 用画像アセット

## 主要コマンド

```bash
npm run build      # esbuild で dist/ を生成
npm run watch      # src/ と public/ を監視して自動ビルド
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint (アーキテクチャ規約)
npm run test       # Vitest (単体 + 契約テスト)
npm run check      # typecheck + lint + test + build (コミット前に必ず)
npm run build:inject  # Playwright 注入用バンドル (tests/dist/inject-bundle.js)
npm run package    # build + zip 生成 (.crx 配布用)
```

ローカル動作確認は `npm run build` 後、`chrome://extensions/` で
「パッケージ化されていない拡張機能を読み込む」→ `dist/` を指定。

## アーキテクチャ規約 (ESLint で強制)

- **chrome.*/document/navigator 等のグローバルに触れてよいのは `shared/platform/**` と
  各エントリの `main.ts` のみ**。他は Port インターフェースをコンストラクタ注入で受け取る
- **副作用 (リスナ登録・即時実行) は `main.ts` に集約**。他モジュールは import しても何も起きない
- **メッセージ追加は `shared/protocol/messages.ts` の `ProtocolMap` に型を足す**。
  送信 (BackgroundClient/TabClient) と受信 (MessageRouter.on) の型が自動で揃う
- **待機は `shared/async/wait-for.ts` の waitFor/waitForQuiet/sleep のみ**。
  時間は `shared/config/timing.ts` の命名定数で根拠をコメントに残す (直値は lint エラー)
- fire-and-forget async 禁止 (`no-floating-promises`)。意図的な非待機は `void promise`

## リリース手順

以下はパッケージング手順のみ。ブランチ運用/リリースチャネルの流れ
(`ver/x.x.x` → develop → GitHub prerelease + ストア審査 → 承認後 prerelease 解除 → main) は
`.claude/skills/release-workflow` を参照。

1. `public/manifest.json` の `version` を更新
2. `npm run check` が green であること
3. `npm run package` で zip 生成
4. README/README_ja の参照モデル名やパラメータ記述に齟齬がないか確認

## 落とし穴 / 注意点

- **ビルド必須**: `src/` や `public/` を編集しても `npm run build` するまで `dist/` に反映されない。
  `src/` か `src/shared/config/selectors.json` を編集したら `npm run build:inject` も必要
  (Playwright テストのバンドルが古いままになる)
- **target を ES2022 (chrome120) 未満に下げない**: private field (`#`) が WeakMap に
  downlevel され挙動と可読性が変わる。tsconfig と build.mjs の両方で固定している
- **Gemini UI 変更追従**: Gemini の DOM が変わったら `src/shared/config/selectors.json` を更新。
  セレクタ ID の増減は `SelectorId` 型が全参照箇所を検査し、options 画面は自動追従する。
  待機ロジックの調整は `shared/config/timing.ts`
- **静的ファイルとの同期は契約テストが守る**: `public/rules.json` / `public/manifest.json` /
  `docs/js/extension-ready-poller.js` と `shared/config` のズレは `tests/contract/` が検出する。
  ext-* パラメータを増減したら契約テストの失敗に従って両側を直す
- **凍結された公開 wire**: externally_connectable の PING 応答 (`{status:'ALIVE', version}`) と
  `buildUrl` のフラグメント出力形式は docs/ ページと公開済み共有 URL が依存するため変更禁止
- **URL パラメータの取り扱い**: クエリ形式 (`?key=value`) はサーバに漏れるため、
  フラグメント形式 (`#key=value`) を使う。`QueryParameter` は両方を読み取るが、
  生成時 (`buildUrl`) は必ずフラグメント形式で出力する
- **storage キーの互換性**: `customSelectors` / `selectorStatus` (sync) と
  `urlGenerateOptions` (local) は既存ユーザーデータがあるため変更禁止
