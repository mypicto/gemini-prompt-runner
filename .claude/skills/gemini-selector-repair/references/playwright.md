# Playwright MCP での操作

`.mcp.json` に登録された `playwright` MCP (`mcp__playwright__*`) を使う。ブラウザのインストールやログインの永続化などセットアップは、`gemini-selector-tests` スキルの `references/playwright.md` を参照する。

## ページを開く

```
mcp__playwright__browser_navigate({ url: "https://gemini.google.com/app" })
```

`.playwright-user-data/` にログイン状態が保存されている。未ログインならユーザーに、そのブラウザで手動ログインしてもらう。

## 評価

```
mcp__playwright__browser_evaluate({ function: "() => <式>" })
```

- `function` には関数を渡す。`probe-expression.mjs` の出力は即時実行の式なので、`"() => " + 出力` の形で包む
- 非同期の処理は `"async () => { ... }"` にすれば await される
- 戻り値はシリアライズされて返る

例 (モデルメニューを開いてプローブ):

```
mcp__playwright__browser_evaluate({ function: "() => document.querySelector('bard-mode-switcher button').click()" })
mcp__playwright__browser_evaluate({ function: "() => <probe-expression.mjs の出力>" })
mcp__playwright__browser_evaluate({ function: "() => document.querySelector('bard-mode-switcher button').click()" })
```

本番の `ElementLocator` / `ModelMenu` で確かめたい場合は、`gemini-selector-tests` の手順でバンドルを注入して `window.__t` を使う。

## 待機

```
mcp__playwright__browser_wait_for({ time: 20 })   // 秒
```

## スクリーンショット

```
mcp__playwright__browser_take_screenshot()
```

DOM 構造は `mcp__playwright__browser_snapshot()` (アクセシビリティツリー) でも確認できる。

## 未ログインのページ

別の `--user-data-dir` か incognito で起動したブラウザを使う (`.mcp.json` の変更はユーザーに依頼する)。難しければ、Cookie 無しの `curl` で HTML を取り、`scripts/check-login-link.py` で検査する。
