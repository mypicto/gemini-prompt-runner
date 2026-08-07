---
name: release-workflow
description: >-
  gemini-prompt-runner (Chrome 拡張) のリリース工程 —— ブランチ運用とリリースチャネルの流れ
  (ver/x.x.x → develop へマージ → GitHub Release を prerelease で作成 + zip を Chrome
  ウェブストアへ審査提出 → 審査通過後に prerelease 解除 → main へマージ) —— を、タグ規約と
  具体コマンド付きで案内するスキル。「リリースする / バージョンを切る・上げる / ver/1.x.x
  ブランチを作る / develop・main へマージ / GitHub Release・prerelease を作る / ウェブストアに
  審査提出する / 審査が通ったので公開・昇格する / リリース手順を教えて」等の発話が出たら必ず使う。
  CLAUDE.md の「リリース手順」はパッケージング (version 更新・npm run check・npm run package の
  zip) しか扱わず、ブランチ/チャネルの流れは本スキルにしか無いので、リリースを進める依頼では
  明示されなくても本スキルの適用を疑うこと。パッケージングそのものは CLAUDE.md を参照する。
---

# Release Workflow (gemini-prompt-runner)

Chrome 拡張のリリースは **ストア審査という非同期の外部ゲート** を挟む。そのため
「審査に出した状態」と「一般公開 (昇格) した状態」を GitHub Release の **prerelease フラグ**で
分離し、**`main` には常にストア承認済みのコードだけを載せる**。この不変条件を壊さないことが
このワークフローの目的。

## ブランチとタグの規約

| 対象 | 規約 | 役割 |
| --- | --- | --- |
| 作業ブランチ | `ver/X.Y.Z` (旧: `verX.Y.Z`) | 1 リリース分の開発 |
| 統合ブランチ | `develop` | 審査に出す候補を集約 |
| 公開ブランチ | `main` (default) | **ストア承認済み**のみ。`develop` をマージして前進 |
| RC タグ | `verX.Y.ZRC` (git tag のみ) | 審査に出した候補ビルドの目印。GitHub Release は作らない |
| 本リリースタグ | `verX.Y.Z` | GitHub Release のタグ。昇格後の正式版 |

- `public/manifest.json` の `version` が唯一のバージョン源。タグ名はこれに合わせる。
- **GitHub Release は本タグ `verX.Y.Z` で 1 つだけ**作り、作成時は `--prerelease`、承認後に解除する。
  RC 用の別 Release は作らない (`verX.Y.ZRC` は git タグのみ / `gh release view verX.Y.ZRC` は
  "not found" になるのが正常)。
- 配布 zip は **Chrome ウェブストアへ提出**する運用で、GitHub Release には添付しない
  (過去 Release の assets は空)。保管目的で添付したい場合のみ任意。

## 手順

**すべてのリリース (パッチ含む) でこのゲートを通す。** 例外を作らない
(ストア提出には必ず審査があるため)。

### 1. 準備 (`ver/X.Y.Z` ブランチ上)
- `public/manifest.json` の `version` を更新 (バージョン源。develop/main で直接上げない)
- `npm run check` が green
- `npm run package` で配布 zip を生成
- ※パッケージングの詳細は `CLAUDE.md` の「リリース手順」を参照 (ここでは重複させない)

### 2. develop へ統合
```bash
git switch develop && git merge --no-ff ver/X.Y.Z
git push origin develop
```

### 3. RC タグを打ち、GitHub prerelease を作ってストアへ提出
```bash
# 候補ビルドの目印 (RC タグ、git のみ)
git tag verX.Y.ZRC && git push origin verX.Y.ZRC

# GitHub Release を prerelease で作成 (本タグ verX.Y.Z を develop 先端に作る)
gh release create verX.Y.Z --prerelease --target develop \
  --title "verX.Y.Z" --notes "<変更点>"
```
- 生成した zip を **Chrome ウェブストアのデベロッパーダッシュボード**からアップロードして
  審査に提出する。

### 4. 審査待ち (外部・非同期ゲート)
Chrome ウェブストアの審査完了を待つ。ここは自分の手を離れる。**通過するまで `main` は動かさない。**

### 5. 承認後: 昇格して main へ
```bash
# prerelease を解除して正式版化 (同じ Release を編集)
gh release edit verX.Y.Z --prerelease=false --latest

# main へ昇格 (main = 公開中のストア版)
git switch main && git merge --no-ff develop
git push origin main
```

## 注意点 / why

- **`main` は承認後にしか前進させない。** これが「main = 公開中のストア版」を保証する不変条件。
  審査で修正が入ったら develop 側で直し、再度 prerelease → 審査。
- **RC/prerelease ゲートは全リリース必須** (パッチも)。ストア提出に審査が必ず伴うため例外なし。
- **version bump は `ver/X.Y.Z` 上** (`public/manifest.json`)。
- ストア用スクリーンショット等の画像アセットは `store/`。
- 自動化は無い (`.github/workflows/ci.yml` は check、`static.yml` は GitHub Pages のみ)。
  リリースは手動 + `gh` / `git`。
- パッケージング (zip 生成) は `npm run package` / `archive.sh`、詳細は `CLAUDE.md`。

## 参考: 過去リリースの確認
```bash
gh release list                                    # 本リリース一覧。prerelease 中も分かる
gh release view verX.Y.Z --json tagName,isPrerelease,assets
git tag --sort=-creatordate                        # RC/最終タグの対応 (verX.Y.ZRC → verX.Y.Z)
```
