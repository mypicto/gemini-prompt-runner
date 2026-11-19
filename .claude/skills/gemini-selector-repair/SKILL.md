---
name: gemini-selector-repair
description: Gemini の DOM セレクタ (`selectors.json`) を実 Gemini ページで点検し、壊れたものを特定・修正する。Gemini の更新後にモデル切替 (ext-m)・プロンプト投入・送信・回答コピー等が動かなくなったとき、またはセレクタが壊れていないか一通り確認したいときに使う。テスト基盤の運用は gemini-selector-tests。
---

# Gemini セレクタ点検・修正

Gemini Web は予告なく DOM を変える。拡張が止まる原因のほとんどは `src/shared/config/selectors.json` のどれかが新 DOM に合わなくなったことで、修正も大抵このファイルだけで済む。難しいのは「どれが・なぜ」壊れたかを実 DOM で突き止めることなので、本スキルはその調査手順を中心にまとめている。

## ブラウザ環境の選択

実 DOM を調べるには、ログイン済みの Gemini ページで JS を評価できるブラウザが要る。操作の手段は環境ごとに違うので、使う環境の reference を読んでから始める。

| 環境 | 使える条件 | 読むもの |
|---|---|---|
| Orca 内蔵ブラウザ | `orca` CLI があり、Orca が起動している | `references/orca.md` |
| Playwright MCP | `mcp__playwright__*` ツールがある | `references/playwright.md` |

どちらも使えるなら、ユーザーが指定した方を使う。指定がなければ、ユーザーが普段ログインしている方を優先する (ログインの手間が省ける)。どちらも無ければ、DevTools でモデルメニュー等の `outerHTML` を貼ってもらう方法に切り替える。

以下の手順に出てくる操作は、どの環境でも次の 4 つで足りる。具体的なコマンドは reference に書いてある。

- **評価**: ページで JS の式を評価して結果を受け取る
- **待機**: 数秒待つ (UI の反映や回答の生成を待つ)
- **スクリーンショット**: 画面を撮って目視する
- **未ログインのページ**: ログインしていない状態の Gemini を用意する

## 手順

### 1. 現状の把握

- `src/shared/config/selectors.json` を読み、各 ID がコードのどこでどう使われているかを確認する (`grep -rn "'<id>'" src/content`)。**ID ごとに「何を返すことを期待しているか」(例: `modelListLabel` は *モデル名* のテキスト) を把握しておく。** 一致件数だけ見ても、中身の意味が変わった壊れ方は見抜けない
- ユーザーの症状 (「メニューは開くが選べない」等) から、怪しい ID の当たりを付ける。`ElementLocator` はタイムアウト時に `TimeoutError` を投げ、`ModelMenu.selectModel` などは `OperationCanceledError` しか握りつぶさない。そのためセレクタ不一致は「途中で止まる」症状として現れやすい

### 2. 全 ID の一括プローブ

```bash
node .claude/skills/gemini-selector-repair/scripts/probe-expression.mjs [id ...]
```

が出力した式をページで評価する (渡し方は reference)。各 ID について、一致件数・先頭要素のタグ/クラス・テキスト冒頭が返る。`modelListLabel` については、メニュー項目ごとのラベル一覧 (`items`) も返る。

状態によって出ない要素があるので、件数 0 を即「壊れた」と判断しない:

| ID | 出現条件 | 確認の仕方 |
|---|---|---|
| `modelListButton` / `modelListLabel` / `modelListSelectedItem` | モデルメニューを開いている間 | `modelMenuButton` を `.click()` → 別の評価でプローブ → もう一度クリックして閉じる |
| `sendButton` | 入力欄にテキストがあるとき | 入力欄に `focus()` → `document.execCommand("insertText", false, "selector test")`。確認後に `selectAll` + `delete` で必ず消す |
| `copyButton` | 回答がある会話 | 既存の会話を開く。無ければテスト送信が必要だが、**会話履歴が残るので送信前にユーザーへ確認する**。Thinking 系モデルは回答に 20 秒以上かかる |
| `serviceLoginLink` | 未ログイン時のみ | ログイン済みのページでは 0 が正常。未ログインのページを用意するか、Cookie 無しで取った HTML を `scripts/check-login-link.py` で検査する (使い方はスクリプト冒頭) |

### 3. 意味の検査 (重要)

件数が 1 以上でも、次を確かめる:

- **テキストが期待どおりの種類か。** 例: 2026-11 の更新で `span.label` はモデル名ではなく用途説明 (「複雑な問題」) になり、モデル名は `div.sublabel` に移った。件数は合っていたが中身が別物だった
- **複数一致のとき先頭が正しい要素か。** `find` は `querySelector` (先頭) を使う。例: `textareaContainer` は `ql-editor` (本体) と `ql-clipboard` の 2 件に一致するが、先頭が本体なので問題ない
- **一覧系 (`findAll`) に余計な項目が混ざらないか。** `ext-m=<番号>` はメニュー項目の出現順なので、ログイン誘導・区切り線などが混ざると番号がずれる

### 4. 壊れた ID の原因調査

壊れた要素の周辺 DOM を評価で取得する。`outerHTML` を丸ごと返すと巨大になるので、テキストを持つ葉要素を `tag.class=text` の形で並べると読みやすい:

```js
[...document.querySelectorAll("<親の候補>")].map(e => ({ role: e.getAttribute("role"), attrs: [...e.attributes].map(a => a.name), leaves: [...e.querySelectorAll("span,div")].filter(x => !x.children.length && x.textContent.trim()).map(x => x.tagName + "." + x.className + "=" + x.textContent.trim()) }))
```

新しいセレクタを選ぶときの考え方:

- `role` / `data-test-id` / カスタム要素名 (`gem-menu-item` 等) は比較的安定している。Angular の `_ngcontent-*` や `ng-tns-*` は毎ビルド変わるので使わない
- 旧セレクタとの差分を最小にする (何が変わったかが diff で読めるように)
- 候補セレクタで手順 2・3 をやり直し、件数と中身の両方が期待どおりになることを確認する

### 5. 実操作での確認

新しいセレクタを使った式で、実際の操作 (項目クリック → ヘッダ表示が変わる等) が成立するかを確かめる。**ユーザーの状態を変えたら元に戻す** (選択モデル、入力欄の内容)。

### 6. 修正

- 基本は `src/shared/config/selectors.json` だけを直す。ID の増減は不要なことが多い (増減するなら `SelectorId` 型がコンパイル時に参照箇所を教えてくれる)
- `tests/scenarios/*.md` の期待値の例 (モデル名など) が古くなっていれば更新する
- 構造変化でロジック (例: `model-menu.ts`) も変える必要がある場合は、変更点をユーザーに説明してから着手する

### 7. 検証

```bash
npm run check         # typecheck + lint + test + build
npm run build:inject  # Playwright 用バンドル (selectors.json を変えたら必須)
```

`node_modules` が無ければ `npm ci --cache "$TMPDIR/npm-cache"` (既定の `~/.npm` はサンドボックスで書けないことがある)。単体テストはフェイクの locator を使うので、セレクタを変えても落ちないのが普通。green でも実 DOM での確認の代わりにはならない。

拡張としての通し確認は、ユーザーに `chrome://extensions` で `dist/` を再読み込みしてもらい、症状の出ていた URL (例: `#ext-m=0`) を試してもらう。

## 報告

ユーザーには次の形で返す:

- 原因 (どの ID が、DOM の何が変わって壊れたか) と修正内容 (旧 → 新セレクタ)
- 全 ID の点検結果の表 (ID / 結果 / 確認方法)。状態依存で直接確認できなかったもの・代替手段で確認したものは明記する
- 副作用 (テスト送信で残った会話など) と、ユーザー側で必要な作業 (拡張の再読み込み、バージョン更新の要否)

コミットやバージョン更新はユーザーに頼まれてから行う (`release-workflow` スキル参照)。
