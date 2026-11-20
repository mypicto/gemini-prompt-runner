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

## サンドボックスに阻まれたとき

Bash ツールのコマンドはサンドボックス内で動きます。外で動くのは、設定の `sandbox.excludedCommands` に入っているコマンドだけです（設定はプロジェクトの `.claude/settings.json` とユーザーの `~/.claude/settings.json` などに分かれ、両方が効きます）。一覧は変わることがあるので、覚えておかずに必要なときに読んでください。

どのコマンドでも、次のような兆候があればサンドボックスが原因と考えます。

- `<sandbox_violations>` が出る、または `Operation not permitted` / `EPERM` / `Permission denied` で失敗する
- 通信が失敗する: TLS の `x509: OSStatus -26276`（キーチェーンが使えない）、プロキシの `Forbidden` や `This proxy requires authentication…`
- 認証情報や設定ファイルを読み書きできない（`could not lock config file .git/config` など）。認証ヘルパーや Git フックが `Permission denied` で止まる
- ライセンスや認証を要するツールが、初期化に失敗したまま終了しない
- 手元（`!` 付き）で実行すると成功する

兆候が出たら、設定を疑う前に次を試してください。

1. `excludedCommands` を読み、そのコマンドが入っているかを確かめる。確かめずに「入っていない」と決めつけない。
2. 入っていれば、Bash ツールの1回の呼び出しをそのコマンドだけにして、実行し直す。照合は呼び出し全体に対して、シェル展開の前の字面で行われ、ほかのコマンドや解析できない書き方が1つでも混ざると、全体がサンドボックス内で動く。同じ呼び方でのリトライや、`--no-verify` などでフックや検証を飛ばす回避はしない。
3. 入っていなければ、サンドボックスを避ける方法は探さない。当たった制限をユーザーに伝え、`!` での実行か `excludedCommands` への追加を提案する。サンドボックス設定を変えるかはユーザーが決める。

次のものを混ぜると、全体がサンドボックス内で動きます。

- 除外されていないコマンドとの連結やパイプ（`cd … && cmd`、`cmd | tail`）。作業ディレクトリは引き継がれるので、`cd` は要りません。別のリポジトリは `git -C <dir>` のようにコマンド側で指定します。出力を絞るときは、`--format` / `--json` / `--jq` などコマンド自身のオプションを使い、それでも加工が要るなら呼び出しを分けるか、`run_in_background: true` の出力ファイルを後から Read します。
- ファイルへのリダイレクト（`> /dev/null` も）
- `VAR=… cmd` の前置
- コマンド置換とヒアドキュメント（`--body "$(cat <<'EOF' … EOF)"`）。PR やコミットを作るときの定番の書き方ですが、ここでは使えません。
- バッククォート（単一引用符の中でも同じ）。Markdown の本文にはたいてい含まれるので、長い本文は Write ツールでファイルに書き、`--body-file <path>` や `-F <path>` で渡します。
- 登録と字面が一致しない呼び方。たとえば、相対パスで登録したスクリプトを絶対パスや変数経由で呼ぶと一致しません。

`2>&1`、引用符の中の改行や `;`、除外されたコマンドどうしを `&&` や `;` でつなぐことは問題ありません。変数は形によって扱いが変わり（`"$USER"` は外、`"$HOME/…"` は内側で動いた例がある）、確かめずに使わないでください。

実行前に確かめるには、`allowed_domains` を付けて呼びます。外で動く形なら、Bash ツールが「allowed_domains applies only to a command that runs in the sandbox」と実行前に拒否します。拒否されずに実行されたら、その形はサンドボックス内で動いています。

サンドボックス内では、ほかにも次の制約があります。

- `ps` / `pgrep` は使えない。長いコマンドは `run_in_background: true` で起動して完了通知を待ち、止めるときはタスクの停止（TaskStop）を使う。
- 通信できるのは `sandbox.network.allowedDomains` のドメインだけ。ほかの宛先が要るならユーザーに確認する。

過去の例:

- `cd <repo> && git push` → SSH の `This proxy requires authentication…`、認証ヘルパーの `Permission denied`
- `gh pr create --body "$(cat <<'EOF' …)"` → TLS の `x509: OSStatus -26276`
- `<除外されたコマンド> | head` → `EPERM`

### このリポジトリでの補足

- `.claude/settings.json` の `sandbox` は、`filesystem.allowWrite` に `~/Library/Caches/ms-playwright`（Playwright ブラウザのキャッシュ）、`excludedCommands` に `npx @playwright/mcp` が入っている。後者は字面の完全一致でしか外に出ない（実測: 引数なしの `npx @playwright/mcp` は外、`npx @playwright/mcp --version` や `npx @playwright/mcp install-browser chrome-for-testing` は内側）。Playwright MCP サーバは `.mcp.json` から Claude Code が起動するもので、Bash ツールのサンドボックスとは別。
- `npx <パッケージ>` はサンドボックス内だと `~/.npm/_cacache` に書けず `EPERM` で失敗する。npm が出す「root-owned files … `sudo chown -R …` を実行せよ」はサンドボックスによる誤誘導なので、所有者の変更はしない。Playwright ブラウザのインストールなど npx が要る作業は、ユーザーに `!` での実行を頼む（手順は `.claude/skills/gemini-selector-tests/references/playwright.md`）。
- `.claude/skills/` には Bash から書き込めないので、Edit / Write ツールで編集する。
- `.claude/settings.json` の `sandbox` 設定はチームが決める。Claude は必要性と登録する字面を提案するに留め、編集はユーザーの指示があるときだけ行う。

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
