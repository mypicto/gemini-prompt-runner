# Scenario 04: Login Link (未ログイン状態のリンク)

## 目的
ログアウト状態の Gemini ページに表示される Google ログインリンクを確認する。`src/content/page/login-link.ts` (`LoginLink` — `exists()` / `click()`) が依存するセレクタ。

## 検証対象セレクタ ID
- `serviceLoginLink` (`a[href^="https://accounts.google.com/ServiceLogin"]`)

## 前提
- **未ログイン状態** であること
  - `.mcp.json` の `--user-data-dir` を一時的に別ディレクトリに切り替えるか、
  - Playwright MCP の incognito モード相当を使う
  - または Gemini にログアウト → リロード

## 手順

1. `tests/dist/inject-bundle.js` を `Read` で取得
2. `mcp__playwright__browser_navigate({ url: "https://gemini.google.com/" })`
3. ページが安定するまで待機 (`browser_wait_for({ time: 3 })`)
4. **未ログインの確認**:
   ```
   mcp__playwright__browser_evaluate({ function:
     "() => !!document.querySelector('a[href^=\"https://accounts.google.com/ServiceLogin\"]')"
   })
   ```
   - 期待: `true` (ログインリンクが見える状態)
5. bundle 注入 + bootstrap (Scenario 01 のステップ 4-5)
6. **probe**:
   ```
   mcp__playwright__browser_evaluate({ function:
     "() => window.__t.probe('serviceLoginLink', 2000)"
   })
   ```

## 期待結果

- `found: true`
- `tag: "A"`
- `selector` が `selectors.json` に定義された通り

## 失敗時

- そもそも未ログイン状態になっているか再確認 (ステップ 4)
- Gemini のログイン誘導 UI が `boqOnegoogleliteOgbOneGoogleBar` 配下から移動していないか調査
