Output the following text, preserving structure, language, and style.

# Prompt Runner for Google Gemini

この拡張機能は、Google GeminiのWebアプリに追加のURLパラメータを渡せるようにすることで、標準では対応していないプロンプトの自動実行を可能にします。

## 機能

* URLのパラメータからプロンプトを自動実行（オプションでプロンプトの入力のみにすることも可能）
* URLのパラメータからモデルの選択
* テキストを選択していない状態で `Ctrl + C` / `Cmd + C` キーを押すことで最後の回答をコピー

## 用途

* よく使うモデルやプロンプトをブックマークに登録
* CLIからプロンプト実行のトリガー

## 操作方法

```plaintext
https://how-to-use
    ?ext-q=enter-prompt-text
    &ext-m=select-model-index
    &ext-confirm=flag-to-prevent-auto-submit-by-q-parameter

Ctrl+C / Cmd+C: copy the last answer.
```

| パラメータ | 説明 | 値 |
| --- | --- | --- |
| `ext-q` | 実行するプロンプト文字列 | URLエンコードされたテキスト |
| `ext-m` | 選択するモデルのインデックス | 0 から始まる整数（UI上での表示順） |
| `ext-confirm` | `ext-q`パラメータによる自動送信の抑制 | `true/false` または `0/1` |

### 帰属

Google Gemini™ は Google LLC の商標です。
