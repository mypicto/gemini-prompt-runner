# Gemini Prompt Runner

この拡張機能は、URL パラメータを使って自動的にGeminiのWebアプリを操作します。

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

## 使い方

| パラメータ | 説明 | 値 |
| --- | --- | --- |
| `q` | プロンプトの文字列 | URLエンコードされたテキスト |
| `m` | 選択するモデルのインデックス | 0 から始まる整数（UI上での表示順） |
| `confirm` | プロンプトを送信する前に確認するかどうか（自動送信OFF） | `true/false` または `0/1` |

### 使用例

#### 4番目のモデルでプロンプトを自動実行する

https://gemini.google.com/app?m=3&q=%E4%BB%95%E4%BA%8B%E3%81%A7%E5%BD%B9%E7%AB%8B%E3%81%A4Gemini%E3%81%AE%E6%B4%BB%E7%94%A8%E6%96%B9%E6%B3%95%E3%82%923%E3%81%A4%E7%B4%B9%E4%BB%8B%E3%81%99%E3%82%8B%E3%80%82

#### 3番目のを直ぐに呼び出せるブックマークを作成する

https://gemini.google.com/app?m=2

### よく使うプロンプトを登録しておき、利用時に指示を追加する

https://gemini.google.com/app?q=%E4%BB%A5%E4%B8%8B%E3%81%AE%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88%E3%82%92%E7%BF%BB%E8%A8%B3%E3%81%97%E3%81%A6%E3%80%82%0D%0A%0D%0A%0D%0A&confirm=1
