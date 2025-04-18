Output the following text, preserving structure, language, and style.

# Prompt Runner for Google Gemini

この拡張機能は、Google GeminiのWebアプリに追加のURLパラメータを渡せるようにすることで、標準では対応していないプロンプトの自動実行を可能にします。

## 機能

* URLパラメーターによるプロンプトの自動実行（パラメーターはサーバーに送信されず、ブラウザー内で安全に処理されます）
  * プロンプト内のキーワード `{{clipboard}}` をクリップボードのテキストに置換（オプション）
  * プロンプトの自動送信（オプション）
* URLパラメーターによるモデルの選択
* 現在のプロンプトと選択中のモデルから、Prompt Runner for Google Gemini で使用可能なURLを生成
* テキスト未選択状態で `Ctrl + C` / `Cmd + C` キーを押すと、最後の回答をコピー（コピーボタンを必要とするので、一定以上のウィンドウサイズが必要）

## 用途

* プロンプトのテンプレートをブックマークに登録
* CLIからプロンプト実行のトリガー

## 操作方法

```plaintext
https://how-to-use
    ?ext-q=enter-prompt-text
    &ext-m=select-model
    &ext-clipboard=replace-keywords-in-prompt-with-clipboard-text
    &ext-send=auto-send-for-prompt

Ctrl+C / Cmd+C: copy the last answer.
```

| パラメータ | 説明 | 値 |
| --- | --- | --- |
| `ext-q` | 実行するプロンプト文字列 | URLエンコードされたテキスト（`{{clipboard}}`キーワードでクリップボードのテキストを挿入） |
| `ext-m` | 選択するモデルのインデックス | 0 から始まる整数（UI上での表示順）またはモデル名（UI上での表示名） |
| `ext-clipboard` | `ext-q`の中で`{{clipboard}}`キーワードをクリップボードのテキストと置き換える | `true/false` または `0/1` |
| `ext-send` | プロンプトの自動送信 | `true/false` または `0/1` |

> [!TIP]
> `ext-send` を有効にした状態で、`ext-q` を複数指定することで複数のプロンプトを連続して送信することができます。

## サンプル

* 今日の天気予報を質問

  ```url
  https://gemini.google.com/app?ext-q=%E4%BB%8A%E6%97%A5%E3%81%AE%E5%A4%A9%E6%B0%97%E4%BA%88%E5%A0%B1%E3%80%82&ext-send=1
  ```

* 3番目のモデルでチャットを開始

  ```url
  https://gemini.google.com/app?ext-m=2
  ```

* Deep Research モデルでチャットを開始

  ```url
  https://gemini.google.com/app?ext-m=DeepResearch
  ```

* クリップボードのテキストを要約する

  ```url
  https://gemini.google.com/app?ext-q=%E5%85%A5%E5%8A%9B%E3%81%95%E3%82%8C%E3%81%9F%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88%E3%82%92%E8%A6%81%E7%B4%84%E3%81%99%E3%82%8B%E3%80%82%0A%0A%2A%2AInput%3A%2A%2A%0A%7B%7Bclipboard%7D%7D&ext-clipboard=1
  ```

### 帰属

Google Gemini™ は Google LLC の商標です。
