# Playwright MCP 環境での実行

`.mcp.json` に登録された `playwright` MCP (`mcp__playwright__*` ツール) でシナリオを動かすときの手順。シナリオ markdown の手順はこの環境の表記で書かれているので、そのまま実行できる。

## 1. 初回セットアップ

セッションをまたぐと環境が崩れていることがある。エラーが起きてから直すより、最初に下記を確認しておくほうが速い。

### 1.1 Playwright ブラウザのインストール

初回は Chromium のダウンロードが必要だが、**サンドボックスが `~/Library/Caches/ms-playwright` への書き込みを拒否する** ことが多い。

**対策 A: settings.json で書き込み許可 (推奨)**

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

`.claude/settings.json` は Claude 側 (Edit/Write/Bash) から編集できない (self-modification ルールでブロック)。**ユーザーに手動編集を依頼する**。sandbox 設定は起動時にしか読まれないので、編集後は Claude Code の再起動が必要。

**対策 B: 環境変数で cache を逃がす (緊急避難)**

ユーザーが手動で `~/.cache/ms-playwright` に入れたあと、`.mcp.json` に `env.PLAYWRIGHT_BROWSERS_PATH` を渡す。これも `.mcp.json` 編集 + 再起動を伴う。

**インストール実行**

```bash
npm_config_cache="$TMPDIR/npm-cache" npx @playwright/mcp install-browser chrome-for-testing
```

`npm_config_cache` は `~/.npm/_cacache` の root 所有ファイルで EPERM になるケースの回避。成功すると `~/Library/Caches/ms-playwright/chromium-XXXX` などができる (初回約 90MB)。

### 1.2 Google アカウントへのログイン

`.mcp.json` の `--user-data-dir=./.playwright-user-data` が永続セッションを保存する (gitignore 済み)。

- 初回: ユーザーに「`https://gemini.google.com/app` を Playwright MCP のブラウザで開いて手動でログインしてください」と依頼
- 2 回目以降: 保存済みクッキーで自動ログイン
- 未ログイン状態が要るシナリオ (04): 別の `--user-data-dir` か incognito で起動する

## 2. ページを開く

```
mcp__playwright__browser_navigate({ url: "https://gemini.google.com/app" })
mcp__playwright__browser_wait_for({ text: "Gemini", time: 5 })
```

`Page URL: about:blank` が返ったらブラウザがリセットされている。再 navigate し、バンドルも再注入する。

## 3. バンドルを注入する

`tests/dist/inject-bundle.js` は IIFE 形式で、トップレベルに `var __geminiSelectorTest = (() => { ... })()` を吐く。**`page.evaluate` の中で実行すると関数スコープになるため、トップレベルの `var` は `window` に上がらない**。末尾で `globalThis` に代入する必要がある:

```js
() => {
  // ... bundle source 全体 ...
  globalThis.__geminiSelectorTest = __geminiSelectorTest;
  return typeof globalThis.__geminiSelectorTest;  // "object" が返れば OK
}
```

### 推奨: wrapper ファイル方式

bundle を Read してコンテキストに載せずに済む (トークン消費がほぼゼロ):

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

そのうえで `mcp__playwright__browser_run_code_unsafe({ filename: "<絶対パス>/.playwright-mcp/inject-wrapper.js" })` を呼ぶと `"object"` が返る。

- wrapper の置き場所は **リポジトリ配下** (MCP の allowed roots 制約で `$TMPDIR` は拒否される)。`.playwright-mcp/` は gitignore 済み
- `browser_run_code_unsafe` の中では `require` / dynamic import が使えない。だから bundle を文字列として埋め込む

**フォールバック**: bundle を Read し、`browser_evaluate` の `function` 引数に直接 inline で書く (Read の行番号は剥がす)。

**CSP**: Gemini の CSP は厳しいが、`page.evaluate` で渡したスクリプトは CSP の制約を受けない。`<script>` タグの動的注入や `fetch` は CSP に引っかかるので避ける。

### inline 簡略版 (緊急時)

`window.__t` が消えた / ブラウザがリセットされたときに、本物の bundle の代わりに `ElementLocator` + 必要なコンポーネントだけを inline で組んで `globalThis.__geminiSelectorTest = { bootstrap: async () => ({ ... }) }` を作ってもよい。手書きするなら private field (`#xxx`) は `_xxx` に置き換える (JSON エスケープのトラブル元)。本物の bundle の方がテストとして忠実なので、デフォルトは本物を注入する。

## 4. bootstrap

```
mcp__playwright__browser_evaluate({ function:
  "async () => { window.__t = await __geminiSelectorTest.bootstrap(); return Object.keys(window.__t); }"
})
```

## 5. シナリオ手順の実行

シナリオの `mcp__playwright__browser_evaluate({ function: "..." })` / `browser_wait_for` / `browser_snapshot` をそのまま呼ぶ。

## 6. UI 言語の切り替え

```
mcp__playwright__browser_navigate({ url: "https://gemini.google.com/app?hl=en" })   // 英語 UI
mcp__playwright__browser_navigate({ url: "https://gemini.google.com/app?hl=ja" })   // 日本語 UI (元の言語に戻す)
```

遷移すると `window.__t` は消えるので、3〜4 章の注入と bootstrap をやり直す。

## 7. トラブルシュート

| 症状 | 対処 |
|---|---|
| `Browser "chrome-for-testing" is not installed` | 1.1 の install-browser を実行。settings.json の `allowWrite` を確認 |
| `EPERM: ... mkdir '~/Library/Caches/ms-playwright'` | サンドボックスの書き込み拒否。1.1 の対策 A (再起動要)、またはユーザーに `! npx @playwright/mcp install-browser chrome-for-testing` を実行してもらう |
| 注入後に `typeof __geminiSelectorTest === "undefined"` | `globalThis` への代入を忘れている (3 章) |
| `Page URL: about:blank` | ブラウザがリセットされた。再 navigate + 再注入 |
| DOM を目視したい | `mcp__playwright__browser_snapshot()` |
