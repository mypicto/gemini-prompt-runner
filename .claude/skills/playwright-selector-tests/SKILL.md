---
name: playwright-selector-tests
description: Gemini Prompt Runner (Chrome 拡張) の Playwright MCP ベースのセレクタテスト基盤を運用するスキル。`tests/scenarios/*.md` の実行、新シナリオの追加、`tests/src/inject-entry.ts` 編集後のバンドル再ビルド、`browser_evaluate` 経由の IIFE 注入と `globalThis` 露出のコツ、初回セットアップ（Playwright ブラウザの cache 配置、`.claude/settings.json` の sandbox 設定、Google アカウントログインの永続化）まで、テストの実行・追加・メンテに関わる作業で必ず参照する。「tests/scenarios/XX-XXX.md を実行」「Playwright MCP のテストを動かす」「セレクタテストを実行」「Gemini UI 変更でテストが壊れていないか確認」「新しいシナリオを追加して」「inject-bundle.js を再ビルド」「テスト基盤を再セットアップ」「ブラウザインストールが失敗する」「bundle 注入後 globalThis が見えない」といった発言が出たら必ずこのスキルを使う。テスト関連で「これでテストが通るか確認しといて」と曖昧に頼まれた場面でも本スキルの適用を疑うこと。
---

# Playwright Selector Tests

このリポジトリ (`gemini-prompt-runner`) の `tests/` は、Chrome 拡張本体 (TypeScript ソース `src/`、esbuild で `dist/` にバンドル) のセレクタ解決ロジック (`ElementLocator` 他) を **実 Gemini ページ** に対して Playwright MCP 経由で検証する基盤です。本スキルは「シナリオを実行する」「シナリオを追加する」「基盤をメンテする」「トラブルシュート」を一気に扱います。

## 全体像

```
tests/
├── src/inject-entry.ts   ← 本番モジュール (src/content/page/*, src/shared/*) を DI 化して bootstrap する入口
├── build-bundle.mjs      ← esbuild で IIFE 形式の dist/inject-bundle.js を生成
├── dist/inject-bundle.js ← 生成物。Gemini ページに browser_evaluate で注入する
└── scenarios/XX-XXX.md   ← シナリオ。Claude が手順を読みながら実行する markdown
```

実行の流れは:

1. リポジトリルートで `npm install && npm run build:inject` して `tests/dist/inject-bundle.js` を作る
2. Playwright MCP で `https://gemini.google.com/app` に navigate
3. `browser_evaluate` でバンドルをページに注入（CSP を `page.evaluate` 経由で回避）
4. `bootstrap()` を呼んで `window.__t` に `selectorService` 等の参照を載せる
5. シナリオ markdown の手順に従って `probe` / `probeAll` / 各コンポーネントメソッドを呼ぶ
6. 結果を整理してユーザーに報告

## いつ使うか — トリガー早見表

| ユーザー発言 | 取るアクション |
| --- | --- |
| "`tests/scenarios/01-baseline.md` を実行して" | 「シナリオ実行ルート」(下) を頭から |
| "セレクタテスト動かして" | 何のシナリオか不明なら確認 → 該当シナリオを実行 |
| "Gemini UI が変わったかも、確認して" | `01-baseline` → `02-model-list` の順に走らせて probeAll の `found` を見る |
| "新シナリオを追加して" | 「シナリオを追加する」セクション参照 |
| "selectors.json を変えた / inject-entry.ts を変えた" | `tests/dist/inject-bundle.js` を必ず再ビルド (運用上の規約) |
| "ブラウザインストールで EPERM" | 「初回セットアップ」セクションのサンドボックス対応 |

# 1. 初回セットアップ

セッションをまたぐと環境が崩れていることがある。エラーが起きてから直すよりも、最初に下記を確認しておくほうが速い。

## 1.1 Playwright ブラウザのインストール

`.mcp.json` に `playwright` MCP が登録済み。初回は Chromium のダウンロードが必要だが、**サンドボックスが `~/Library/Caches/ms-playwright` への書き込みを拒否する** ことが多い。

### 対策パターン A: settings.json で書き込み許可（推奨）

`.claude/settings.json` (このリポジトリの) に下記を追加すると、サンドボックス内のままで Playwright のデフォルト cache に書き込める:

```json
{
  "sandbox": {
    "filesystem": {
      "allowWrite": [
        "/Users/<you>/Library/Caches/ms-playwright"
      ]
    }
  }
}
```

注意: `.claude/settings.json` の編集は Claude 側（Edit/Write/Bash）からは Auto Mode の self-modification ルールで HARD ブロックされる。**ユーザーに手動編集を依頼する**こと。編集後は **Claude Code 再起動が必要** (sandbox 設定は起動時にしか読み込まれない)。

### 対策パターン B: 環境変数で cache を逃がす（緊急避難）

ユーザーが手動で `~/.cache/ms-playwright` に入れたあと、`.mcp.json` に `env.PLAYWRIGHT_BROWSERS_PATH` を渡す。これも `.mcp.json` 編集 + Claude Code 再起動を伴う。

### インストール実行

settings.json が整ったら:

```bash
npm_config_cache="$TMPDIR/npm-cache" npx @playwright/mcp install-browser chrome-for-testing
```

`npm_config_cache="$TMPDIR/npm-cache"` は、`~/.npm/_cacache` に root-owned ファイルがあって EPERM になるケースの回避。`export npm_config_cache="$TMPDIR/npm-cache"` と分けても OK。

成功時:
- `/Users/<you>/Library/Caches/ms-playwright/chromium-XXXX` などができる
- 初回約 90MB のダウンロードが走る

## 1.2 Google アカウントへの初回ログイン

Gemini はログイン必須。`.mcp.json` の `--user-data-dir=./.playwright-user-data` が永続セッションを保存する。

- 初回: ユーザーに「`https://gemini.google.com/app` を Playwright MCP で開いて手動でログインしてください」と依頼
- 2 回目以降: `.playwright-user-data/` のクッキーで自動ログイン

`.playwright-user-data/` は `.gitignore` 対象。

## 1.3 依存パッケージ

リポジトリルートで:

```bash
npm install --cache "$TMPDIR/npm-cache"   # 初回のみ
```

`tests/package.json` は廃止済み。依存はルートの `package.json` に統合されており、バンドルに必要な `esbuild` もルートの devDependencies にある。

# 2. シナリオ実行ルート (デフォルトのフロー)

ユーザーが「`tests/scenarios/XX-XXX.md` を実行して」と言ったら、機械的に下記を順番に実行する。

## 2.1 シナリオを読む

`Read /Users/.../tests/scenarios/XX-XXX.md`。手順 / 期待結果 / 失敗時の対応を把握する。

シナリオ 01〜04 はステップ 1〜5 が **共通** (bundle 注入 + bootstrap)。05 以降も同じパターン。

## 2.2 bundle の有無と新しさを確認

```bash
ls -la /Users/.../tests/dist/inject-bundle.js
```

存在しない or `tests/src/` / `src/` を最近触っていたら再ビルド (4 章参照)。

## 2.3 Gemini に navigate

```
mcp__playwright__browser_navigate({ url: "https://gemini.google.com/app" })
mcp__playwright__browser_wait_for({ text: "Gemini", time: 5 })
```

`Page URL: about:blank` が返ったらブラウザがリセットされている。再 navigate する。

## 2.4 bundle を注入する (本スキルの核心)

`tests/dist/inject-bundle.js` は esbuild の IIFE 形式で、トップレベルに `var __geminiSelectorTest = (() => { ... })()` を吐く。**`page.evaluate` の中で実行すると関数スコープになるため、トップレベルの `var` は `window` に上がらない**。 直接 `browser_evaluate` に渡すだけでは次の呼び出しから見えない。

### 必須テクニック: 末尾で `globalThis.__geminiSelectorTest = __geminiSelectorTest;`

bundle の中身全体を `() => { ... }` で包み、最後に `globalThis` への代入と `return typeof globalThis.__geminiSelectorTest` を足す。これがシナリオ markdown が暗に前提にしている形:

```js
() => {
  // ... bundle source 全体（27〜28KB 前後）...
  globalThis.__geminiSelectorTest = __geminiSelectorTest;
  return typeof globalThis.__geminiSelectorTest;  // "object" が返ればOK
}
```

期待結果は `"object"`。

### bundle ソースの受け渡し (推奨: wrapper ファイル方式)

bundle はおよそ 27〜28KB。**推奨は wrapper ファイル方式**: bundle を Read してコンテキストに載せる必要がなく、トークン消費がほぼゼロになる。

```bash
node -e '
const fs = require("fs");
const bundle = fs.readFileSync("tests/dist/inject-bundle.js", "utf8");
const code = "async (page) => {\n  const src = " + JSON.stringify(bundle) +
  ";\n  return await page.evaluate(\"(() => { \" + src +
  \"; globalThis.__geminiSelectorTest = __geminiSelectorTest; return typeof globalThis.__geminiSelectorTest; })()\");\n}";
fs.writeFileSync(".playwright-mcp/inject-wrapper.js", code);
'
```

そのうえで `mcp__playwright__browser_run_code_unsafe({ filename: "<絶対パス>/.playwright-mcp/inject-wrapper.js" })` を呼ぶと `"object"` が返る。注意:
- wrapper の置き場所は **リポジトリ配下** であること (MCP の allowed roots 制約。`$TMPDIR` は拒否される)。`.playwright-mcp/` は gitignore 済みで最適
- `browser_run_code_unsafe` のコード内では `require` / dynamic import は使えない (fs 直読み不可)。だから bundle を文字列として埋め込む

フォールバック (wrapper が使えない場合): bundle を Read し、`browser_evaluate` の `function` 引数に直接 inline で書く。Read tool で見ると行番号がつくが、渡すときは生のソースを書く（行番号は剥がす）。

CSP 回避: Gemini ページの CSP は厳しいが、Playwright の `page.evaluate` で渡したスクリプトは CSP 制約を受けずに実行できる（既知の挙動）。`<script>` タグ動的注入や `fetch` は CSP に引っかかるので避ける。

### Private field (`#xxx`) の注意

本番側コード (`src/content/page/element-locator.ts` 等) は `#selectorOf` のような private field を使い、esbuild 後のバンドルにも `#` 構文のまま残る。これは JS 構文として有効なので、bundle をそのまま注入できる。**ただし簡略版を手書きで作るなら `_underscoreName` などに置き換えること** (`#` を含む文字列は JSON エスケープのトラブル元になりやすい)。

### bundle 注入を省く inline 簡略版

セッション内で 1 回 evaluate しただけで `window.__t` が消えた / ブラウザがリセットされた場合、本物の bundle を再貼付するよりも、`locator` (+ 互換シム `selectorService`) + 必要なコンポーネントだけ inline で組んだ簡略版で代用してもよい。基本構造:

```js
() => {
  const selectors_default = { /* src/shared/config/selectors.json の中身 */ };
  class ElementLocator { /* ... */ }
  class ModelMenu { /* ... */ }
  class NominalModelQuery { /* ... */ }
  class Model { /* ... */ }
  class OperationCanceledError extends Error { /* ... */ }
  globalThis.__geminiSelectorTest = {
    bootstrap: async () => ({ locator: new ElementLocator(...), selectorService: /* locator を包む互換シム */, modelSelector: new ModelMenu(...), NominalModelQuery, /* ... */ })
  };
  return typeof globalThis.__geminiSelectorTest;
}
```

簡略版は「コンテキスト消費を抑える」「private field 周りのエスケープを避ける」目的で使う。**本物の bundle を載せる方がテストとしては忠実**なので、デフォルトは本物のバンドルを注入する。

## 2.5 bootstrap

```js
mcp__playwright__browser_evaluate({ function:
  "async () => { window.__t = await __geminiSelectorTest.bootstrap(); return Object.keys(window.__t); }"
})
```

返り値の keys に `locator`, `selectorService`, `selectors`, `modelSelector`, `sendButton`, `textarea`, `copyButton`, `loginButton`, `NominalModelQuery`, `FallbackModelQuery`, `QueryParameter`, `probe`, `probeAll` が含まれることを確認。`selectorService` は旧シナリオ手順互換のシム (`getElement(id, timeoutMs, context)` / `getElements` / `existsElement`)、`locator` が新 API (`find(id, {timeoutMs, context})` / `findAll` / `exists`)。

## 2.6 シナリオ固有のステップを実行

シナリオ markdown 6 番以降を順に。各 `browser_evaluate` のあとに必要なら `browser_wait_for({ time: 1 })` で UI を落ち着かせる。

## 2.7 結果報告

| ID | found | tag | visible | selector |
... の形で表にして PASS / FAIL を明示。失敗があったら markdown 末尾の「失敗時の対応」セクションに従う。`selectors.json` の書き換えは **ユーザー判断**、勝手にやらない。

# 3. シナリオを追加する

```
tests/scenarios/06-xxx.md
```

を新規作成し、以下を踏襲する:

- 1〜5 を「Scenario 01 と同じ準備 (bundle 注入 + bootstrap)」と書いて省略
- 6 番以降に独自手順
- 期待結果 / 失敗時の対応を必ず書く
- `tests/README.md` のシナリオ表に行を追加する

実行時に新しい本番モジュールやクラスを直接呼びたい場合は `tests/src/inject-entry.ts` の `bootstrap()` 返り値に追加 export する。例: シナリオ 05 のために `NominalModelQuery` を expose した。

```ts
import { NominalModelQuery } from '../../src/shared/core/model-query.js';
// ...
return { /* 既存 */, NominalModelQuery, /* ... */ };
```

inject-entry.ts を編集したら **必ずルートで `npm run build:inject`**。さもないと注入される dist が古いまま。

# 4. Bundle 再ビルド

```bash
cd /Users/.../gemini-prompt-runner && npm run build:inject
```

`tests/build-bundle.mjs` は esbuild を呼ぶだけ。10〜20ms で終わる。`tests/dist/inject-bundle.js` のサイズが想定通り (27〜28KB 程度) になっているか確認。

`tests/README.md` の規約: **以下のいずれかを編集したら必ず再ビルド**

- `tests/src/inject-entry.ts`
- `src/content/page/**` (ElementLocator, ModelMenu, PromptTextarea, SendButton, ResponseCopyButton, LoginLink)
- `src/shared/**` (特に `config/selectors.json`)

# 5. トラブルシュート

## 5.1 `Browser "chrome-for-testing" is not installed`

→ 1.1 の install-browser 実行。settings.json の `sandbox.filesystem.allowWrite` を確認。

## 5.2 `EPERM: operation not permitted, mkdir '~/Library/Caches/ms-playwright'`

→ サンドボックスが書き込みを拒否している。settings.json で `allowWrite` を追加し Claude Code を再起動するか、ユーザーに手動で `! npx @playwright/mcp install-browser chrome-for-testing` を実行してもらう (`!` prefix でホストシェル実行)。

## 5.3 `Selector with ID "xxx" missing` / probe で `found: false`

セレクタが Gemini UI 変更で壊れた可能性。`browser_snapshot()` で現在の DOM を見て、`src/shared/config/selectors.json` の該当エントリのクラス名やセレクタが現行 DOM に存在するか確認。修正案は提示するが書き換えはユーザー判断。

## 5.4 注入後に `typeof __geminiSelectorTest === "undefined"`

`globalThis` への代入を忘れた。2.4 の注意通り `globalThis.__geminiSelectorTest = __geminiSelectorTest;` を末尾に足す。

## 5.5 `Page URL: about:blank`

ブラウザがリセットされている。`mcp__playwright__browser_navigate` で gemini に戻り、bundle を再注入。

## 5.6 現在モデルラベルの短縮表記とフル表記の不一致 (修正済み)

例: シナリオ 05 で `currentModelLabel` の textContent が短縮表記 (`"Flash"`) なのに `modelListLabel` がフル表記 (`"3.5 Flash"`) を返すケース。かつては正規化が数字プレフィックスを除去せず `"flash"` と `"3.5flash"` がマッチしないバグがあったが、**現在は修正済み**。`NominalModelQuery` に `matchesCurrent(currentQuery)` が追加され、バージョン番号プレフィックスを除いて一致判定される。一方 `equalsQuery` / `equalsModel` は従来どおり厳密一致 (メニュー選択の誤爆防止)。シナリオで「切替後の確認」をするときは `after.equalsQuery(target)` ではなく **`target.matchesCurrent(after)`** を使うこと。

## 5.7 npm の cache 由来の EPERM

`/Users/<you>/.npm/_cacache/tmp/***` への書き込みエラー。`npm_config_cache="$TMPDIR/npm-cache"` を頭に付けて回避。恒久対応は `sudo chown -R <uid>:<gid> ~/.npm`（ユーザー判断、Claude からは触らない）。

## 5.8 `sendButton` の probe が `found: false` (テキスト未入力)

**`sendButton` (`gem-icon-button.send-button`) はテキストエリアが空だと DOM に存在しない** (マイクボタンのみ表示される)。実機で確認済みの挙動であり、セレクタが壊れているとは限らない。probe する前に `window.__t.textarea.setPrompt('...')` でテキストを入れてから再 probe すること。

# 6. 既存シナリオの早見

| ファイル | 検証対象 | 前提 |
| --- | --- | --- |
| `scenarios/01-baseline.md` | `textareaContainer`, `sendButton`, `modelMenuButton`, `currentModelLabel` の取得 | ログイン済・通常チャット画面 |
| `scenarios/02-model-list.md` | `modelListButton`, `modelListLabel` (メニュー展開後) | ログイン済 + モデルメニュー展開 |
| `scenarios/03-copy-menu.md` | `copyButton` (応答後) / `sendButton.submit` / `sendButton.isAnswering` | プロンプト送信 → 応答完了後 |
| `scenarios/04-login-link.md` | `serviceLoginLink` | **未ログイン** 状態 (別 user-data-dir または incognito) |
| `scenarios/05-model-switch.md` | `ModelMenu.selectModel` フル E2E + `NominalModelQuery` 正規化/`matchesCurrent` + `currentModelLabel` 切替 | ログイン済 + モデル選択肢 2 つ以上 |
| `scenarios/06-model-fallback.md` | `FallbackModelQuery` の候補順フォールバック + `QueryParameter` のカンマ区切りパース/ラウンドトリップ | ログイン済 + モデル選択肢 2 つ以上 |

# 7. やってはいけないこと

- `src/shared/config/selectors.json` を勝手に書き換える (ユーザー判断)
- `.claude/settings.json` / `.mcp.json` を Claude 側から編集しようとする (Auto Mode で HARD ブロック)
- 本番コード (`src/`) の挙動を「テストを通すため」に修正する。テストは本番のバグも検出する役割があり、不合格 = テスト基盤の異常とは限らない
- bundle を再ビルドせずに `tests/src/` を編集したまま実行する (dist が stale になり古い挙動を検証してしまう)
