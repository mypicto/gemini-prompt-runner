# Scenario 03: Copy Button (応答後のコピー操作)

## 目的
プロンプトを送信し、応答が完了した後に `message-actions` 内に表示されるコピーボタンを確認する。`src/content/page/response-copy-button.ts` (`ResponseCopyButton` — `exists()` / `clickLatest()`) が依存するセレクタの検証。

## 検証対象セレクタ ID
- `copyButton` (応答メッセージのコピー項目)

## 前提
- Google アカウントログイン済み
- 軽量なプロンプト (`"hi"` 程度) を送信して応答完了を待てること

## 手順

1〜5. Scenario 01 と同じ準備 (bundle 注入 + bootstrap)

6. **プロンプトを入力して送信**:
   ```
   mcp__playwright__browser_evaluate({ function:
     "async () => { await window.__t.textarea.setPrompt('hi'); return 'typed'; }"
   })
   ```
   ```
   mcp__playwright__browser_evaluate({ function:
     "async () => { await window.__t.sendButton.submit(); return 'submitted'; }"
   })
   ```

7. **応答完了を待つ** (最大 60s ポーリング):
   ```
   mcp__playwright__browser_evaluate({ function:
     "async () => { const start = Date.now(); await new Promise(r => setTimeout(r, 1500)); while (await window.__t.sendButton.isAnswering()) { if (Date.now() - start > 60000) return 'timeout'; await new Promise(r => setTimeout(r, 500)); } return 'done'; }"
   })
   ```
   - 期待: `"done"`

8. **copyButton を probe**:
   ```
   mcp__playwright__browser_evaluate({ function:
     "() => window.__t.probe('copyButton', 3000)"
   })
   ```
   - 期待: `found: true`

## 失敗時

- 応答自体が来ていない可能性: `browser_snapshot()` で確認
- Gemini が「コピー」を表すアイコンの `data-test-id` を変更していないか確認 (現状 `"copy-button"`)
- `copy-button` カスタム要素自体が無くなっていないか調査
