# Prompt Runner for Google Gemini

この拡張機能は、URL パラメータに従ってGoogle GeminiのWebアプリをセットアップします。

![](store/gemini-prompt-runner.png)

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
    ?q=enter-prompt-text
    &m=select-model-index
    &confirm=flag-to-prevent-auto-submit-by-q-parameter

Ctrl+C / Cmd+C: copy the last answer.
```

| パラメータ | 説明 | 値 |
| --- | --- | --- |
| `q` | 実行するプロンプト文字列 | URLエンコードされたテキスト |
| `m` | 選択するモデルのインデックス | 0 から始まる整数（UI上での表示順） |
| `confirm` | `q`パラメータによる自動送信の抑制 | `true/false` または `0/1` |

### サンプル

#### モデルとプロンプト指定して自動実行

https://gemini.google.com/app?m=3&q=%E4%BB%95%E4%BA%8B%E3%81%A7%E5%BD%B9%E7%AB%8B%E3%81%A4Gemini%E3%81%AE%E6%B4%BB%E7%94%A8%E6%96%B9%E6%B3%95%E3%82%923%E3%81%A4%E7%B4%B9%E4%BB%8B%E3%81%99%E3%82%8B%E3%80%82

#### よく使うモデルをブックマーク

https://gemini.google.com/app?m=2

### よく使うプロンプトのテンプレートをブックマーク

* [テキストを英訳する](https://gemini.google.com/app?q=%E4%BB%A5%E4%B8%8B%E3%81%AE%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88%E3%82%92%E8%8B%B1%E8%AA%9E%E3%81%AB%E7%BF%BB%E8%A8%B3%E3%81%97%E3%81%A6%E3%80%82%0D%0A%0D%0A%0D%0A&confirm=1)
* [プロンプトを改善する](https://gemini.google.com/app?m=0&q=As+a+prompt+engineer%2C+your+task+is+to+enhance+the+provided+prompts+for+optimal+performance.%0D%0APlease+improve+the+provided+prompts.%0D%0A%0D%0ATake+a+deep+breath.%0D%0A%0D%0A%2A%2AInstructions%3A%2A%2A%0D%0A%2A+Please+improve+the+provided+prompts.%0D%0A%2A+Clearly+specify+the+role+and+the+ultimate+objective+at+the+beginning+of+the+prompt.%0D%0A%2A+Include+%E2%80%9CTake+a+deep+breath+and+let%E2%80%99s+think+step+by+step.%E2%80%9D+in+the+prompt.%0D%0A%2A+The+prompt+should+be+enclosed+in+a+%2A%2Acode+block%2A%2A.%0D%0A%2A+Include+%E2%80%9C%E7%A7%81%E3%81%A8%E3%81%AF%E6%97%A5%E6%9C%AC%E8%AA%9E%E3%81%A7%E4%BC%9A%E8%A9%B1%E3%81%97%E3%81%A6%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84%E3%80%82%E2%80%9D+in+the+prompt.%0D%0A%0D%0A%2A%2ASteps%3A%2A%2A%0D%0A1.+Ask+three+questions+to+clarify+context+and+user+stories.%0D%0A2.+Wait+for+a+response+from+me.%0D%0A3.+Determine+the+most+suitable+role+for+performing+this+task.%0D%0A4.+Improve+the+prompt+step+by+step+based+on+the+tips.%0D%0A5.+Generate+the+improved+English+prompt+and+output+it+within+a+code+block.%0D%0A6.+Display+the+prompt+translated+into+Japanese+for+confirmation.%0D%0A%0D%0A%2A%2ATips%3A%2A%2A%0D%0A1.+Always+phrase+instructions+in+an+affirmative+manner.%0D%0A2.+Write+concise+and+clear+instructions+by+breaking+down+complex+instructions+into+simple+steps.%0D%0A3.+Chain-of-Thought+%28CoT%29%3A+The+reasoning+process+is+explicitly+written+out+to+solve+complex+problems+step+by+step.%0D%0A4.+Few-Shot%3A+A+method+where+a+few+examples+%28e.g.%2C+Q%26A+or+task+execution+patterns%29+are+included+in+the+prompt+to+help+the+model+learn+the+task+pattern.%0D%0A%0D%0A%2A%2AExamples%3A%2A%2A%0D%0A%3Cexamples%3E%0D%0A%3Cexample%3E%0D%0A%3Cinput%3E%0D%0ASOLID%E5%8E%9F%E5%89%87%E3%82%92%E8%A7%A3%E8%AA%AC%E3%80%82%0D%0A%3C%2Finput%3E%0D%0A%3Coutput%3E%0D%0A%0D%0A%23%23+%E3%82%BF%E3%82%B9%E3%82%AF%E3%81%AB%E6%9C%80%E9%81%A9%E3%81%AA%E3%83%AD%E3%83%BC%E3%83%AB%0D%0A%E3%81%93%E3%81%AE%E3%82%BF%E3%82%B9%E3%82%AF%E3%81%A7%E3%81%AF%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0%E3%81%AE%E5%8E%9F%E5%89%87%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E8%A7%A3%E8%AA%AC%E3%81%97%E3%81%BE%E3%81%99%E3%80%82%0D%0A%E6%9C%80%E9%81%A9%E3%81%AA%E3%83%AD%E3%83%BC%E3%83%AB%E3%81%AF%E7%B5%8C%E9%A8%93%E8%B1%8A%E5%AF%8C%E3%81%AA%E3%82%BD%E3%83%95%E3%83%88%E3%82%A6%E3%82%A7%E3%82%A2%E9%96%8B%E7%99%BA%E3%81%AE%E8%AC%9B%E5%B8%AB%E3%81%A7%E3%81%99%E3%80%82%0D%0A%0D%0A%23%23+%E6%94%B9%E5%96%84%E3%81%95%E3%82%8C%E3%81%9F%E3%83%97%E3%83%AD%E3%83%B3%E3%83%97%E3%83%88%EF%BC%88%E8%8B%B1%E8%AA%9E%EF%BC%89%0D%0A%60%60%60md%0D%0AYou+are+an+experienced+software+development+instructor%3B+explain+the+SOLID+principles+clearly+and+concisely+to+a+novice.%0D%0A%0D%0ATake+a+deep+breath+and+let%E2%80%99s+think+step+by+step.%0D%0A%0D%0A%2A+First%2C+please+briefly+introduce+the+purpose+of+the+SOLID+Principles+and+clearly+explain+each+principle.%0D%0A%2A+If+necessary%2C+illustrate+key+concepts+with+examples.%0D%0A%2A+Keep+explanations+simple+and+avoid+unnecessary+jargon.%0D%0A%0D%0A%E3%82%8F%E3%81%9F%E3%81%97%E3%81%A8%E3%81%AF%E6%97%A5%E6%9C%AC%E8%AA%9E%E3%81%A7%E4%BC%9A%E8%A9%B1%E3%81%97%E3%81%A6%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84%E3%80%82%0D%0A%60%60%60%0D%0A%0D%0A%23%23+%E3%83%97%E3%83%AD%E3%83%B3%E3%83%97%E3%83%88%E3%81%AE%E6%97%A5%E6%9C%AC%E8%AA%9E%E8%A8%B3%0D%0A%60%60%60md%0D%0A%E3%81%82%E3%81%AA%E3%81%9F%E3%81%AF%E7%B5%8C%E9%A8%93%E8%B1%8A%E5%AF%8C%E3%81%AA%E3%82%BD%E3%83%95%E3%83%88%E3%82%A6%E3%82%A7%E3%82%A2%E9%96%8B%E7%99%BA%E3%81%AE%E8%AC%9B%E5%B8%AB%E3%81%A7%E3%81%99%E3%80%82SOLID%E5%8E%9F%E5%89%87%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E5%88%9D%E5%BF%83%E8%80%85%E3%81%AB%E3%82%82%E5%88%86%E3%81%8B%E3%82%8A%E3%82%84%E3%81%99%E3%81%8F%E7%B0%A1%E6%BD%94%E3%81%AB%E8%AA%AC%E6%98%8E%E3%81%97%E3%81%A6%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84%E3%80%82%0D%0A%0D%0A%E6%B7%B1%E5%91%BC%E5%90%B8%E3%82%92%E3%81%97%E3%81%A6%E3%80%81%E4%B8%80%E6%AD%A9%E4%B8%80%E6%AD%A9%E8%80%83%E3%81%88%E3%81%A6%E3%81%BF%E3%82%88%E3%81%86%E3%80%82%0D%0A%0D%0A%2A+SOLID%E5%8E%9F%E5%89%87%E3%81%AE%E7%9B%AE%E7%9A%84%E3%82%92%E7%B0%A1%E5%8D%98%E3%81%AB%E7%B4%B9%E4%BB%8B%E3%81%97%E3%80%81%E3%81%9D%E3%82%8C%E3%81%9E%E3%82%8C%E3%81%AE%E5%8E%9F%E5%89%87%E3%82%92%E6%98%8E%E7%A2%BA%E3%81%AB%E8%AA%AC%E6%98%8E%E3%81%97%E3%81%A6%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84%E3%80%82%0D%0A%2A+%E5%BF%85%E8%A6%81%E3%81%AB%E5%BF%9C%E3%81%98%E3%81%A6%E3%80%81%E4%B8%BB%E8%A6%81%E3%81%AA%E6%A6%82%E5%BF%B5%E3%82%92%E4%BE%8B%E3%82%92%E7%94%A8%E3%81%84%E3%81%A6%E8%AA%AC%E6%98%8E%E3%81%97%E3%81%A6%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84%E3%80%82%0D%0A%2A+%E8%AA%AC%E6%98%8E%E3%81%AF%E3%82%B7%E3%83%B3%E3%83%97%E3%83%AB%E3%81%AB%E3%81%97%E3%80%81%E4%B8%8D%E5%BF%85%E8%A6%81%E3%81%AA%E5%B0%82%E9%96%80%E7%94%A8%E8%AA%9E%E3%81%AF%E9%81%BF%E3%81%91%E3%81%A6%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84%E3%80%82%0D%0A%60%60%60%0D%0A%0D%0A%23%23+%E6%AC%A1%E3%81%AE%E8%B3%AA%E5%95%8F%E3%81%AB%E7%AD%94%E3%81%88%E3%82%8B%E3%81%93%E3%81%A8%E3%81%A7%E3%80%81%E3%82%88%E3%82%8A%E6%98%8E%E7%A2%BA%E3%81%AA%E3%83%97%E3%83%AD%E3%83%B3%E3%83%97%E3%83%88%E3%82%92%E4%BD%9C%E6%88%90%E3%81%99%E3%82%8B%E3%81%93%E3%81%A8%E3%81%8C%E3%81%A7%E3%81%8D%E3%81%BE%E3%81%99%E3%80%82%0D%0A1.+%E3%81%A9%E3%81%AE%E3%82%88%E3%81%86%E3%81%AA%E7%90%86%E7%94%B1%E3%82%84%E7%9B%AE%E7%9A%84%E3%81%A7SOLID%E5%8E%9F%E5%89%87%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E8%AA%BF%E3%81%B9%E3%81%A6%E3%81%84%E3%81%BE%E3%81%99%E3%81%8B%EF%BC%9F%0D%0A2.+%E3%81%93%E3%81%AE%E8%A7%A3%E8%AA%AC%E3%82%92%E8%AA%AD%E3%82%80%E4%BA%BA%E3%81%AF%E8%AA%B0%E3%81%A7%E3%80%81%E3%81%A9%E3%81%AE%E3%82%88%E3%81%86%E3%81%AA%E7%AB%8B%E5%A0%B4%E3%81%A7%E3%81%99%E3%81%8B%EF%BC%9F%EF%BC%88%E4%BE%8B%EF%BC%9A%E5%88%9D%E5%BF%83%E8%80%85%E5%90%91%E3%81%91%E3%80%81%E4%B8%8A%E7%B4%9A%E8%80%85%E5%90%91%E3%81%91%E3%80%81%E7%89%B9%E5%AE%9A%E3%81%AE%E6%A5%AD%E7%95%8C%E5%90%91%E3%81%91%E3%81%AA%E3%81%A9%EF%BC%89%0D%0A3.+SOLID%E5%8E%9F%E5%89%87%E3%81%AE%E4%B8%AD%E3%81%A7%E7%89%B9%E3%81%AB%E8%A9%B3%E3%81%97%E3%81%8F%E7%9F%A5%E3%82%8A%E3%81%9F%E3%81%84%E9%83%A8%E5%88%86%E3%81%AF%E3%81%82%E3%82%8A%E3%81%BE%E3%81%99%E3%81%8B%EF%BC%9F%EF%BC%88%E4%BE%8B%EF%BC%9A%E7%89%B9%E5%AE%9A%E3%81%AE%E5%8E%9F%E5%89%87%E3%80%81%E3%82%A2%E3%83%B3%E3%83%81%E3%83%91%E3%82%BF%E3%83%BC%E3%83%B3%E3%80%81%E8%A8%80%E8%AA%9E%E3%81%94%E3%81%A8%E3%81%AE%E9%81%A9%E7%94%A8%E4%BE%8B%E3%81%AA%E3%81%A9%EF%BC%89%0D%0A%3C%2Foutput%3E%0D%0A%3Cinput%3E%0D%0A%E9%96%8B%E7%99%BA%E3%83%81%E3%83%BC%E3%83%A0%E3%81%AE%E5%8B%89%E5%BC%B7%E4%BC%9A%E3%81%A7%E4%BF%9D%E5%AE%88%E6%80%A7%E3%81%AE%E9%AB%98%E3%81%84%E3%82%B3%E3%83%BC%E3%83%89%E3%81%AE%E6%9B%B8%E3%81%8D%E6%96%B9%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E7%99%BA%E8%A1%A8%E3%81%97%E3%81%9F%E3%81%84%E3%81%A7%E3%81%99%E3%80%82%0D%0A%E9%96%8B%E7%99%BA%E3%83%81%E3%83%BC%E3%83%A0%E3%81%AE%E4%B8%AD%E3%81%AB%E3%81%AF%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0%E6%AD%B4%E3%81%8C1%E5%B9%B4%E7%9B%AE%E3%81%AE%E4%BA%BA%E3%81%8B%E3%82%89%E3%80%8110%E5%B9%B4%E4%BB%A5%E4%B8%8A%E3%81%AE%E3%83%99%E3%83%86%E3%83%A9%E3%83%B3%E3%81%BE%E3%81%A7%E6%B7%B7%E5%9C%A8%E3%81%97%E3%81%A6%E3%81%84%E3%81%BE%E3%81%99%E3%80%82%0D%0A%E3%81%9D%E3%82%8C%E3%81%9E%E3%82%8C%E3%81%AE%E5%8E%9F%E5%89%87%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E3%80%81%E3%82%A2%E3%83%B3%E3%83%81%E3%83%91%E3%82%BF%E3%83%BC%E3%83%B3%E3%81%A8%E3%81%9D%E3%81%AE%E6%94%B9%E5%96%84%E6%A1%88%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6Java%E8%A8%80%E8%AA%9E%E3%81%A7%E3%81%AE%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%82%B3%E3%83%BC%E3%83%89%E3%81%8C%E6%AC%B2%E3%81%97%E3%81%84%E3%81%A7%E3%81%99%E3%80%82%0D%0A%3C%2Finput%3E%0D%0A%3Coutput%3E%0D%0A%0D%0A%23%23+%E6%94%B9%E5%96%84%E3%81%95%E3%82%8C%E3%81%9F%E3%83%97%E3%83%AD%E3%83%B3%E3%83%97%E3%83%88%EF%BC%88%E8%8B%B1%E8%AA%9E%EF%BC%89%0D%0A%60%60%60md%0D%0AYou+are+an+experienced+software+development+instructor.+Your+task+is+to+explain+the+SOLID+principles+in+a+way+that+improves+code+maintainability.%0D%0AProvide+an+explanation+of+each+SOLID+principle%2C+including+common+anti-patterns+and+their+improvements%2C+with+Java+code+examples.%0D%0A%0D%0ATake+a+deep+breath+and+let%E2%80%99s+think+step+by+step.%0D%0A%0D%0A%2A%2AInstructions%3A%2A%2A%0D%0A1.+Explain+each+SOLID+principle+clearly%2C+ensuring+accessibility+for+both+beginner+and+experienced+developers.%0D%0A2.+For+each+principle%3A%0D%0A%C2%A0%C2%A0+-+Describe+its+importance+in+software+development.%0D%0A%C2%A0%C2%A0+-+Provide+an+example+of+an+anti-pattern+that+violates+the+principle.%0D%0A%C2%A0%C2%A0+-+Offer+a+corrected+version+of+the+code+that+follows+the+principle.%0D%0A%C2%A0%C2%A0+-+Include+a+brief+explanation+of+the+improvement.%0D%0A3.+Ensure+all+Java+code+is+well-formatted+and+easy+to+understand.%0D%0A4.+%E7%A7%81%E3%81%A8%E3%81%AF%E6%97%A5%E6%9C%AC%E8%AA%9E%E3%81%A7%E4%BC%9A%E8%A9%B1%E3%81%97%E3%81%A6%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84%E3%80%82%0D%0A%60%60%60%0D%0A%0D%0A%23%23+%E3%83%97%E3%83%AD%E3%83%B3%E3%83%97%E3%83%88%E3%81%AE%E6%97%A5%E6%9C%AC%E8%AA%9E%E8%A8%B3%0D%0A%60%60%60md%0D%0A%E3%81%82%E3%81%AA%E3%81%9F%E3%81%AF%E7%B5%8C%E9%A8%93%E8%B1%8A%E5%AF%8C%E3%81%AA%E3%82%BD%E3%83%95%E3%83%88%E3%82%A6%E3%82%A7%E3%82%A2%E9%96%8B%E7%99%BA%E3%81%AE%E8%AC%9B%E5%B8%AB%E3%81%A7%E3%81%99%E3%80%82%E3%81%82%E3%81%AA%E3%81%9F%E3%81%AE%E3%82%BF%E3%82%B9%E3%82%AF%E3%81%AF%E3%80%81SOLID%E5%8E%9F%E5%89%87%E3%82%92%E8%A7%A3%E8%AA%AC%E3%81%97%E3%80%81%E3%82%B3%E3%83%BC%E3%83%89%E3%81%AE%E4%BF%9D%E5%AE%88%E6%80%A7%E3%82%92%E5%90%91%E4%B8%8A%E3%81%95%E3%81%9B%E3%82%8B%E6%96%B9%E6%B3%95%E3%82%92%E7%A4%BA%E3%81%99%E3%81%93%E3%81%A8%E3%81%A7%E3%81%99%E3%80%82%0D%0A%E5%90%84SOLID%E5%8E%9F%E5%89%87%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E3%80%81%E4%B8%80%E8%88%AC%E7%9A%84%E3%81%AA%E3%82%A2%E3%83%B3%E3%83%81%E3%83%91%E3%82%BF%E3%83%BC%E3%83%B3%E3%81%A8%E3%81%9D%E3%81%AE%E6%94%B9%E5%96%84%E6%A1%88%E3%82%92%E5%90%AB%E3%82%80Java%E3%82%B3%E3%83%BC%E3%83%89%E3%81%AE%E4%BE%8B%E3%82%92%E6%8F%90%E4%BE%9B%E3%81%97%E3%81%A6%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84%E3%80%82%0D%0A%0D%0A%E6%B7%B1%E5%91%BC%E5%90%B8%E3%82%92%E3%81%97%E3%81%A6%E3%80%81%E3%82%B9%E3%83%86%E3%83%83%E3%83%97%E3%81%94%E3%81%A8%E3%81%AB%E8%80%83%E3%81%88%E3%81%BE%E3%81%97%E3%82%87%E3%81%86%E3%80%82%0D%0A%0D%0A%2A%2A%E6%8C%87%E7%A4%BA%3A%2A%2A%0D%0A1.+%E5%90%84SOLID%E5%8E%9F%E5%89%87%E3%82%92%E6%98%8E%E7%A2%BA%E3%81%AB%E8%AA%AC%E6%98%8E%E3%81%97%E3%80%81%E5%88%9D%E5%BF%83%E8%80%85%E3%81%A8%E7%B5%8C%E9%A8%93%E8%80%85%E3%81%AE%E4%B8%A1%E6%96%B9%E3%81%AB%E3%81%A8%E3%81%A3%E3%81%A6%E7%90%86%E8%A7%A3%E3%81%97%E3%82%84%E3%81%99%E3%81%84%E3%82%88%E3%81%86%E3%81%AB%E3%81%97%E3%81%A6%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84%E3%80%82%0D%0A2.+%E5%90%84%E5%8E%9F%E5%89%87%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%3A%0D%0A%C2%A0%C2%A0+-+%E3%82%BD%E3%83%95%E3%83%88%E3%82%A6%E3%82%A7%E3%82%A2%E9%96%8B%E7%99%BA%E3%81%AB%E3%81%8A%E3%81%91%E3%82%8B%E9%87%8D%E8%A6%81%E6%80%A7%E3%82%92%E8%AA%AC%E6%98%8E%E3%81%99%E3%82%8B%E3%80%82%0D%0A%C2%A0%C2%A0+-+%E3%81%9D%E3%81%AE%E5%8E%9F%E5%89%87%E3%81%AB%E9%81%95%E5%8F%8D%E3%81%97%E3%81%A6%E3%81%84%E3%82%8B%E3%82%A2%E3%83%B3%E3%83%81%E3%83%91%E3%82%BF%E3%83%BC%E3%83%B3%E3%81%AE%E4%BE%8B%E3%82%92%E7%A4%BA%E3%81%99%E3%80%82%0D%0A%C2%A0%C2%A0+-+%E5%8E%9F%E5%89%87%E3%81%AB%E5%BE%93%E3%81%A3%E3%81%9F%E4%BF%AE%E6%AD%A3%E5%BE%8C%E3%81%AE%E3%82%B3%E3%83%BC%E3%83%89%E3%82%92%E6%8F%90%E4%BE%9B%E3%81%99%E3%82%8B%E3%80%82%0D%0A%C2%A0%C2%A0+-+%E6%94%B9%E5%96%84%E7%82%B9%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E7%B0%A1%E6%BD%94%E3%81%AB%E8%AA%AC%E6%98%8E%E3%81%99%E3%82%8B%E3%80%82%0D%0A3.+Java%E3%81%AE%E3%82%B3%E3%83%BC%E3%83%89%E3%81%AF%E9%81%A9%E5%88%87%E3%81%AB%E3%83%95%E3%82%A9%E3%83%BC%E3%83%9E%E3%83%83%E3%83%88%E3%81%97%E3%80%81%E7%90%86%E8%A7%A3%E3%81%97%E3%82%84%E3%81%99%E3%81%84%E3%82%82%E3%81%AE%E3%81%AB%E3%81%99%E3%82%8B%E3%80%82%0D%0A4.+%E3%82%8F%E3%81%9F%E3%81%97%E3%81%A8%E3%81%AF%E6%97%A5%E6%9C%AC%E8%AA%9E%E3%81%A7%E4%BC%9A%E8%A9%B1%E3%81%97%E3%81%A6%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84%E3%80%82%0D%0A%60%60%60%0D%0A%3C%2Foutput%3E%0D%0A%3C%2Fexample%3E%0D%0A%3C%2Fexamples%3E%0D%0A%0D%0A%2A%2AInput%3A%2A%2A%0D%0A%0D%0A&confirm=1)

### 帰属

Google Gemini™ は Google LLC の商標です。
