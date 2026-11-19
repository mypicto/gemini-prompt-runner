---
name: gemini-selector-tests
description: Gemini Prompt Runner のセレクタテスト基盤 (`tests/`) を運用する。`tests/scenarios/*.md` の実行・追加、注入バンドルの再ビルド、テスト用ブラウザ環境 (Playwright MCP / Orca) のセットアップやトラブル対応のときに使う。壊れたセレクタの調査・修正は gemini-selector-repair。
---

# Selector Tests

`tests/` は、拡張本体のセレクタ解決ロジック (`ElementLocator` やページオブジェクト) を **実 Gemini ページ** に注入して検証する基盤。本番モジュールをそのままバンドルしてページに入れ、シナリオ markdown の手順どおりに呼び出す。

```
tests/
├── src/inject-entry.ts   ← 本番モジュール (src/content/page/*, src/shared/*) を DI 化して bootstrap する入口
├── build-bundle.mjs      ← esbuild で IIFE 形式の dist/inject-bundle.js を生成
├── dist/inject-bundle.js ← 生成物。Gemini ページに注入する
└── scenarios/XX-XXX.md   ← シナリオ。Claude が手順を読みながら実行する markdown
```

## ブラウザ環境の選択

ページを開く・バンドルを注入する・JS を評価する手段は環境ごとに違うので、使う環境の reference を読んでから始める。

| 環境 | 使える条件 | 読むもの |
|---|---|---|
| Playwright MCP | `mcp__playwright__*` ツールがある | `references/playwright.md` |
| Orca 内蔵ブラウザ | `orca` CLI があり、Orca が起動している | `references/orca.md` |

どちらも使えるなら、ユーザーが指定した方を使う。指定がなければ Playwright MCP を使う (シナリオの表記がそのまま使えるため)。どちらも無ければセットアップが必要なことをユーザーに伝える。

シナリオ markdown の手順は Playwright MCP の表記 (`mcp__playwright__browser_evaluate` 等) で書かれている。Orca で実行するときは `references/orca.md` の対応表で読み替える。

## シナリオの実行

1. **シナリオを読む** — `tests/scenarios/XX-XXX.md` の手順 / 期待結果 / 失敗時の対応を把握する。01〜06 はステップ 1〜5 (バンドル注入 + bootstrap) が共通
2. **バンドルの新しさを確認** — `tests/dist/inject-bundle.js` が無い、または `tests/src/` や `src/` を最近触っていたら再ビルドする (下記「バンドルの再ビルド」)
3. **Gemini を開く** — 環境の reference に従う。ログイン状態が要る (04 だけは未ログイン)
4. **バンドルを注入して bootstrap** — 環境の reference に従う。完了すると `window.__t` に次が載る:
   - `locator` (新 API: `find(id, {timeoutMs, context})` / `findAll` / `exists`)
   - `selectorService` (旧シナリオ互換のシム: `getElement(id, timeoutMs, context)` / `getElements` / `existsElement`)
   - `selectors`, `modelSelector`, `sendButton`, `textarea`, `copyButton`, `loginButton`
   - `NominalModelQuery`, `FallbackModelQuery`, `QueryParameter`, `probe`, `probeAll`
5. **シナリオ固有の手順を実行** — 6 番以降を順に。UI 操作のあとは 1 秒程度待って落ち着かせる
6. **結果を報告** — `| ID | found | tag | visible | selector |` の表で PASS / FAIL を明示する。失敗があればシナリオの「失敗時」に従う。`selectors.json` の書き換えはユーザー判断 (修正するなら gemini-selector-repair)

## 既存シナリオ

| ファイル | 検証対象 | 前提 |
| --- | --- | --- |
| `01-baseline.md` | `textareaContainer`, `sendButton`, `modelMenuButton`, `currentModelLabel` | ログイン済・通常チャット画面 |
| `02-model-list.md` | `modelListButton`, `modelListLabel`, `modelListSelectedItem` | ログイン済 + モデルメニュー展開 |
| `03-copy-menu.md` | `copyButton` (応答後) / `sendButton.submit` / `sendButton.isAnswering` | プロンプト送信 → 応答完了後 |
| `04-login-link.md` | `serviceLoginLink` | **未ログイン** 状態 |
| `05-model-switch.md` | `ModelMenu.selectModel` の E2E + `NominalModelQuery` の正規化 / `matchesCurrent` | ログイン済 + モデル選択肢 2 つ以上 |
| `06-model-fallback.md` | `FallbackModelQuery` の候補順フォールバック + `QueryParameter` のパース/ラウンドトリップ | ログイン済 + モデル選択肢 2 つ以上 |

03 はプロンプトを送信するので、会話履歴が残ることを先にユーザーへ伝える。

## シナリオを追加する

`tests/scenarios/NN-xxx.md` を新規作成し、既存シナリオの形を踏襲する:

- 1〜5 は「Scenario 01 と同じ準備 (bundle 注入 + bootstrap)」と書いて省略
- 6 番以降に独自手順 (表記は既存シナリオに合わせて Playwright MCP 形式)
- 期待結果 / 失敗時の対応を必ず書く
- `tests/README.md` のシナリオ表と、上の「既存シナリオ」表に行を追加する

新しい本番モジュールやクラスを直接呼びたい場合は、`tests/src/inject-entry.ts` の `bootstrap()` の返り値に追加する (例: 05 のために `NominalModelQuery` を追加した)。編集したら再ビルドする。

## バンドルの再ビルド

```bash
npm run build:inject   # リポジトリルートで。node_modules が無ければ先に npm ci --cache "$TMPDIR/npm-cache"
```

`tests/dist/inject-bundle.js` (約 30KB) が生成される。以下のいずれかを編集したら必ず再ビルドする (古いバンドルのままだと古い挙動を検証してしまう):

- `tests/src/inject-entry.ts`
- `src/content/page/**`
- `src/shared/**` (特に `config/selectors.json`)

## 環境に依存しない注意点

- **`sendButton` はテキストエリアが空だと DOM に存在しない** (マイクボタンのみ)。セレクタ不良と誤認しない。`window.__t.textarea.setPrompt('...')` で入力してから probe する
- **モデル切替後の確認は `target.matchesCurrent(after)` を使う。** ヘッダの現在モデルラベルは短縮表記 (例 `"Pro"`) で、メニュー項目はフル表記 (例 `"3.1 Pro"`)。`matchesCurrent` はバージョン番号を除いて比較する。`equalsQuery` / `equalsModel` は厳密一致 (メニュー選択の誤爆防止) なので、切替確認には使わない
- probe が `found: false` → Gemini の UI 変更でセレクタが壊れた可能性。原因調査と修正は gemini-selector-repair で行う
- npm の cache 由来の EPERM → `--cache "$TMPDIR/npm-cache"` (または `npm_config_cache="$TMPDIR/npm-cache"`) で回避。恒久対応の `sudo chown` はユーザー判断

## やってはいけないこと

- `src/shared/config/selectors.json` を勝手に書き換える (ユーザー判断)
- `.claude/settings.json` / `.mcp.json` を Claude 側から編集しようとする (ブロックされる。ユーザーに依頼する)
- 本番コード (`src/`) を「テストを通すため」に修正する。不合格は本番のバグや Gemini 側の変更を示していることがある
- バンドルを再ビルドせずに `tests/src/` や `src/` を編集したまま実行する
