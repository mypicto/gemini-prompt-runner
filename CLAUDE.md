# CLAUDE.md

## プロジェクト概要

URL介してGeminiWebアプリでプロンプトを実行するChrome拡張機能。
URL パラメータ (`ext-q`, `ext-m`, `ext-clipboard`, `ext-send`, `ext-required-login`) を
フラグメント形式 (`#key=value`) で受け取り、Gemini Web 上でプロンプト投入・モデル選択・自動送信を行う。

## 技術スタック

- 言語: JavaScript, HTML, CSS
- プラットフォーム: Chrome 拡張 Manifest V3 (ES Modules, Service Worker)
- 依存ライブラリ: なし (バンドラー不使用、ブラウザネイティブ ESM)

## ディレクトリ構成

- `extension/` — 拡張機能本体 (Chrome Web Store に公開する成果物)
  - `manifest.json` — Manifest V3 定義。新規 JS を追加したら `web_accessible_resources` に必ず登録
  - `js/background.js` — Service Worker。`webRequest` で URL パラメータを捕捉
  - `js/content.js` — Gemini ページに注入。`content-loader.js` が動的 import で読み込む
  - `js/popup.js` / `js/options.js` — ポップアップ・オプション画面
  - `res/selectors.json` — Gemini DOM セレクタ定義 (UI 変更時の追従ポイント)
- `docs/` — GitHub Pages のリダイレクトページ (`mypicto.github.io/gemini-prompt-runner`)
- `tools/mac/` — Mac Shortcuts 連携用サンプル
- `store/` — Chrome Web Store 用画像アセット

## 主要コマンド

```bash
./archive.sh   # extension/ と LICENSE を gemini-prompt-runner.zip にパッケージ (.crx 配布用)
```

ローカル動作確認は `chrome://extensions/` で「パッケージ化されていない拡張機能を読み込む」→ `extension/` を指定。

## リリース手順

1. `extension/manifest.json` の `version` を更新
2. `./archive.sh` で zip 生成
3. README/README_ja の参照モデル名やパラメータ記述に齟齬がないか確認

## 落とし穴 / 注意点

- **`web_accessible_resources` 同期**: `extension/js/` 配下に新規ファイルを追加した場合、
  `extension/manifest.json` の `web_accessible_resources.resources` にも追記が必要。
  `content-loader.js` が動的 import するため、未登録だと `content.js` のロードに失敗する。
- **Service Worker は `type: "module"`**: ESM のみ使用可、CommonJS や `require` は不可。
- **Gemini UI 変更追従**: Gemini の DOM が変わると拡張が動作不能になる。
  `extension/res/selectors.json` のセレクタを更新し、必要に応じて
  `extension/js/utils/ui-stability-monitor.js` の待機ロジックも見直す。
- **URL パラメータの取り扱い**: クエリ形式 (`?key=value`) はサーバに漏れるため、
  フラグメント形式 (`#key=value`) を使う。`QueryParameter` クラスは両方を読み取るが、
  生成時 (`buildUrl`) は必ずフラグメント形式で出力する。
