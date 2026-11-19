# Orca 内蔵ブラウザ環境での実行

Orca の内蔵ブラウザを `orca` CLI で操作してシナリオを動かすときの手順。シナリオ markdown は Playwright MCP の表記で書かれているので、5 章の対応表で読み替える。

## 1. セットアップ

- `orca` コマンドは Orca アプリへの接続が要る。サンドボックス内で `runtime_access_denied (EPERM)` になる場合は、ユーザーに `/sandbox exclude "orca *"` を依頼する (`orca open` や Orca の再起動では直らないので行わない)
- 除外後も EPERM が出ることがある。パイプ (`| head`)、`2>&1`、`$(...)`、`&&` 連結を外して **`orca ...` 単独のコマンド** にして再実行する。それでも続く場合はユーザーに `!` 付きで実行してもらう
- 拡張機能そのものは不要 (バンドルを直接ページに注入して検証するため)
- ログイン: Orca のブラウザタブで Gemini にログインしてもらう。ログイン状態は Orca のブラウザプロファイルに保存される
- 未ログイン状態が要るシナリオ (04): `orca tab profile create --label <name> --scope isolated --json` で隔離プロファイルを作り、`orca tab create --url https://gemini.google.com/app --profile <id> --json` で開く。終わったらタブとプロファイルを削除する

## 2. ページを開く

```bash
orca tab list --json                                       # 既存の Gemini タブを探す (browserPageId を控える)
orca tab create --url https://gemini.google.com/app --json # 無ければ開く
```

以降のコマンドはアクティブなタブに作用する。複数タブがあるときは `--page <browserPageId>` を付ける。

## 3. バンドルを注入する

`orca eval` はページのグローバルスコープで評価されるため、**バンドルのトップレベル `var __geminiSelectorTest` はそのまま `window` に残る** (Playwright のような `globalThis` への代入は不要)。また Promise は await されて結果が返る。

バンドル (約 30KB) は `$(cat ...)` で渡すしかないが、これはサンドボックス除外が効かず EPERM になるため、**ユーザーに `!` 付きで実行してもらう** (リポジトリルートで):

```
! orca eval --expression "$(cat tests/dist/inject-bundle.js); __geminiSelectorTest.bootstrap().then(t => { window.__t = t; return Object.keys(t); })" --json
```

返り値に `locator`, `selectorService`, `modelSelector` などのキー一覧が出れば注入と bootstrap が完了している。ページをリロード・遷移すると `window.__t` は消えるので、再度依頼する。

確認 (Claude 側で実行できる):

```bash
orca eval --expression "typeof window.__t" --json   # "object" なら注入済み
```

## 4. bootstrap

3 章のコマンドに含まれている。

## 5. シナリオ手順の読み替え

| シナリオの表記 (Playwright MCP) | Orca での実行 |
|---|---|
| `browser_navigate({ url })` | `orca goto --url <url> --json` |
| `browser_evaluate({ function: "async () => { ... }" })` | `orca eval --expression '(async () => { ... })()' --json` (関数を即時実行の形にする) |
| `browser_evaluate({ function: "() => ..." })` | `orca eval --expression '...' --json` (式の部分だけ) |
| `browser_wait_for({ time: N })` | `orca wait --timeout <N*1000> --json` |
| `browser_wait_for({ text })` | `orca eval` でテキストの有無を確認し、無ければ `orca wait` を挟んで繰り返す |
| `browser_snapshot()` | `orca snapshot --json` (アクセシビリティツリー)。DOM の詳細は `orca eval` で `outerHTML` やテキストを返す |
| `browser_take_screenshot()` | `orca screenshot --json` → 返った `path` を Read で見る |
| `browser_click` | `orca click --element <@ref>` (ref は `orca snapshot` から)。単純なら `orca eval` で `.click()` |
| UI 言語の切り替え | `orca goto --url "https://gemini.google.com/app?hl=en" --json` (英語)。戻すときは `?hl=ja`。遷移で `window.__t` は消えるので再注入を依頼する |

注意:
- `--expression` はシェルのシングルクォートで囲む。式の中ではダブルクォートだけを使う (シングルクォートを含むならダブルクォート囲みにして `"` と `$` をエスケープ)
- 戻り値のオブジェクト・配列は自動で JSON 化されて `result.result` に入る
- 「クリックする eval」と「結果を読む eval」は分けると、UI の反映待ちを挟める

## 6. トラブルシュート

| 症状 | 対処 |
|---|---|
| `runtime_access_denied (EPERM)` | 1 章。コマンドを単独にして再実行 → それでもダメならユーザーに `!` 実行を依頼 |
| `typeof window.__t` が `"undefined"` | リロード/遷移で消えた。3 章の注入をユーザーに再依頼 |
| `runtime_unavailable` | Orca が忙しい・再起動中。数秒待って再実行 (`orca open` はしない) |
