# Orca 内蔵ブラウザでの操作

## 接続とサンドボックス

- `orca` コマンドは Orca アプリへの接続が要る。サンドボックス内で `runtime_access_denied (EPERM)` になる場合は、ユーザーに `/sandbox exclude "orca *"` を依頼する (`orca open` や Orca の再起動では直らないので行わない)
- 除外後も EPERM が出ることがある。パイプ (`| head`)、`2>&1`、`$(...)`、`&&` 連結、`cd ... &&` を外して **`orca ...` 単独のコマンド** にして再実行する。それでも続く場合はユーザーに `!` 付きで実行してもらう
- `runtime_unavailable` は Orca が忙しい・再起動中。数秒待って再実行する

## ページを開く

```bash
orca tab list --json                                       # 既存の Gemini タブを探す
orca tab create --url https://gemini.google.com/app --json # 無ければ開き、ユーザーにログインを頼む
```

コマンドはアクティブなタブに作用する。複数タブがあるときは `--page <browserPageId>` を付ける。

## 評価

```bash
orca eval --expression '<式>' --json
```

- ページのグローバルスコープで評価される。Promise は await され、オブジェクト・配列は自動で JSON 化されて `result.result` に入る
- 式はシェルのシングルクォートで囲む。式の中ではダブルクォートだけを使う。`probe-expression.mjs` の出力はこの形になっているので、そのまま貼れる (`$(node ...)` で渡すと EPERM になりやすいので、出力をコピーして貼る)
- 「クリックする評価」と「結果を読む評価」は別コマンドに分けると、UI の反映待ちを挟める

例 (モデルメニューを開いてプローブ):

```bash
orca eval --expression 'document.querySelector("bard-mode-switcher button").click()' --json
orca eval --expression '<probe-expression.mjs の出力>' --json
orca eval --expression 'document.querySelector("bard-mode-switcher button").click()' --json   # 閉じる
```

## 待機

```bash
orca wait --timeout 20000 --json   # ミリ秒。回答生成待ちなど
```

## スクリーンショット

```bash
orca screenshot --json   # 返った result.path を Read で開いて目視する
```

DOM 構造を見たいときは `orca snapshot --json` (アクセシビリティツリー) も使える。

## UI 言語の切り替え

```bash
orca tab list --json                                            # 戻り先として現在の URL を控える
orca goto --url "https://gemini.google.com/app?hl=en" --json    # 英語 UI
orca goto --url "https://gemini.google.com/app?hl=ja" --json    # 日本語 UI (元の言語に戻す)
```

`goto` の結果にアクセシビリティツリーが返るので、表示言語が切り替わったか (ボタン名などが英語か) はそこで分かる。会話ページを開いていた場合は、最後に控えた URL へ戻す。

## 未ログインのページ

1. 隔離プロファイルを作って開く (サンドボックスで止まることがある):
   ```bash
   orca tab profile create --label gpr-logged-out --scope isolated --json
   orca tab create --url https://gemini.google.com/app --profile <profileId> --json
   ```
   確認が済んだら `orca tab close --page <id>` と `orca tab profile delete` で片付ける
2. 1 が使えなければ、Cookie 無しの `curl` で HTML を取り、`scripts/check-login-link.py` で検査する
