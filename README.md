# Prompt Runner for Google Gemini

この拡張機能は、Google GeminiのWebアプリに追加のURLパラメータを渡せるようにすることで、標準では対応していないプロンプトの自動実行を可能にします。

![store screen-shot](store/gemini-prompt-runner.png)

## 機能

* URLのパラメータからプロンプトを自動実行（オプションでプロンプトの入力のみにすることも可能）
* URLのパラメータからモデルの選択
* テキストを選択していない状態で `Ctrl + C` / `Cmd + C` キーを押すことで最後の回答をコピー

## 用途

* よく使うモデルやプロンプトをブックマークに登録
* CLIからプロンプト実行のトリガー

## 動作環境

* Google Chrome
* Microsoft Edge
* Opera
* Brave
* Arc
* 他、Chromium 派生のブラウザ

## インストール

1. [Releases](https://github.com/mypicto/gemini-prompt-runner/releases/latest) から最新版の crx ファイルをダウンロードし、ローカルに保存。
2. Chromeで拡張機能を管理(`chrome://extensions/`) にアクセス
3. 右上の「デベロッパーモード」を有効にする
4. ダウンロードした crx ファイルをブラウザにドラッグ&ドロップ
5. 拡張機能を追加ボタンを押下

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

### サンプル

#### モデルとプロンプト指定して自動実行

* [https://gemini.google.com/app?ext-m=3&ext-q=%E4%BB%95%E4%BA%8B%E3%81%A7%E5%BD%B9%E7%AB%8B%E3%81%A4Gemini%E3%81%AE%E6%B4%BB%E7%94%A8%E6%96%B9%E6%B3%95%E3%82%923%E3%81%A4%E7%B4%B9%E4%BB%8B%E3%81%99%E3%82%8B%E3%80%82](https://gemini.google.com/app?ext-m=3&ext-q=%E4%BB%95%E4%BA%8B%E3%81%A7%E5%BD%B9%E7%AB%8B%E3%81%A4Gemini%E3%81%AE%E6%B4%BB%E7%94%A8%E6%96%B9%E6%B3%95%E3%82%923%E3%81%A4%E7%B4%B9%E4%BB%8B%E3%81%99%E3%82%8B%E3%80%82)

#### よく使うモデルをブックマーク

* [https://gemini.google.com/app?ext-m=2](https://gemini.google.com/app?ext-m=2)

#### よく使うプロンプトのテンプレートをブックマーク

* [テキストを英訳する](https://gemini.google.com/app?ext-q=%E4%BB%A5%E4%B8%8B%E3%81%AE%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88%E3%82%92%E8%8B%B1%E8%AA%9E%E3%81%AB%E7%BF%BB%E8%A8%B3%E3%81%97%E3%81%A6%E3%80%82%0D%0A%0D%0A%0D%0A&ext-confirm=1)

### 帰属

Google Gemini™ は Google LLC の商標です。
