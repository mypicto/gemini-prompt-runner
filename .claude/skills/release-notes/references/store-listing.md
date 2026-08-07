# Chrome ウェブストア掲載文コーパス (日英)

このファイルはユーザー提供の Chrome ウェブストア掲載全文をそのまま保存したもの
(過去リリースノート ver1.3.0〜1.6.3 を含む)。リリースノートのトーン学習用ゴールドコーパス
兼、説明・機能一覧・帰属など静的部分の参照。

> 注記: 下記コーパスの日本語側に "Gemuni" という誤記が複数ある(正しくは "Gemini")。
> これは実掲載文の記録として verbatim 保存している。**新規生成では再現しないこと。**

---

## 日本語 (JP)

この拡張機能は、Google GeminiのWebアプリに追加のURLパラメータを渡せるようにすることで、標準では対応していないプロンプトの自動実行を可能にします。

機能：

- URLパラメーターによるプロンプトの自動実行（※1）
    - プロンプト内のキーワード `{{clipboard}}` をクリップボードのテキストに置換（オプション）
    - プロンプトの自動送信（オプション）
    - Geminiにログインしていない場合に自動実行を防止（オプション）
- URLパラメーターによるモデルの選択
- 現在のプロンプトと選択中のモデルから、Prompt Runner for Google Gemini で使用可能なURLを生成
- テキスト未選択状態で `Ctrl + C` / `Cmd + C` キーを押すと、最後の回答をコピー（コピーボタンを必要とするので、一定以上のウィンドウサイズが必要）

※1：拡張機能がインストールされている環境では、パラメーターはサーバーに送信されずブラウザー内で安全に処理されます。他の環境へURLを共有する場合もサーバーには送信されませんが、Web解析ツールによって参照される可能性があります。

用途：

- プロンプトのテンプレートをブックマークに登録
- CLIからプロンプト実行のトリガー

リリースノート (ver1.6.3)：

- Gemini の TrustedHTML 制約により、プロンプトをテキストエリアに入力できない不具合を修正。
- Google Gemini のUI変更に追従し、モデル選択ボタンなどのセレクタを更新。

リリースノート (ver1.6.2)：

- Google Gemuni の初期化完了を待ちすぎてしまう不具合を修正。

リリースノート (ver1.6.1)：

- Google Gemuni のUIからモデルの切り替えボタンを見つけられない不具合を修正。

リリースノート (ver1.6.0)：

- Gemini のサイトデザイン変更に備え、サイト内のUIを特定するための CSS selector を変更できるオプションページを追加
- Google Gemuni のUIからモデルの切り替えボタンを見つけられない不具合を修正。

リリースノート (ver1.5.3)：

- プロンプトが自動実行されないケースを修正。
- 回答のコピーボタンがメニューの外にある場合にメニューを開かないように修正。

リリースノート (ver1.5.2)：

- Google Gemuni のUIからモデルの切り替えボタンを見つけられない不具合を修正。

リリースノート (ver1.5.1)：

- Google Gemuni のUIからモデルの切り替えボタンを見つけられない不具合を修正。

リリースノート (ver1.5.0)：

- クエリパラメータ形式でのパラメータ指定に対して、フラグメント形式を推奨するメッセージを表示。
- URL生成オプションの選択状態を記憶するように変更。
- 内部設計の改善。
- モデル名に全角の括弧が使われていた場合に、モデル名を完全一致させないとモデルを切り替えられない問題を修正。

リリースノート (ver1.4.1)：

- フラグメント形式 (#) でのパラメータ指定に対応し、プライバシーが向上。
- リダイレクトページ（試験運用）を仲介させることで、拡張機能をインストールしていない環境でURLを開いてもプロンプトがサーバーに送信されない方法を整備。
- Geminiにログインしていない環境で、プロンプトの自動実行を行わないオプションを追加。
- GeminiのUI変更に伴い、UIが操作できなくなった不具合を修正。

リリースノート (ver1.3.0)：

- `ext-send` パラメータと複数の `ext-q` パラメータを組み合わせることで、プロンプトの連続送信に対応。
- 拡張機能のアイコンに自動操作の進捗を表示するよう変更。

帰属：

Google Gemini™ は Google LLC の商標です。

---

## English (EN)

This extension allows automatic execution of prompts, which is not supported by default, by passing additional URL parameters to the Google Gemini web app.

Features:

- Automatic prompt execution via URL parameters (^1)
    - Replacement of the keyword `{{clipboard}}` in prompts with clipboard text (optional)
    - Automatic prompt submission (optional)
    - Prevent automatic execution when not logged into Gemini (optional)
- Model selection via URL parameters
- Generation of URLs usable in Prompt Runner for Google Gemini from the current prompt and selected model
- Copying of the last response when `Ctrl + C` / `Cmd + C` is pressed without text selection (requires a copy button, so a certain window size is necessary)

^1: When the extension is installed, parameters are not sent to the server and are securely processed within the browser. Even if such a URL is shared with another environment, the parameters will not be sent to the server; however, if the extension is not installed in that environment, there is a risk that the parameters may be accessed by web analytics tools.

Use Cases:

- Register prompt templates in bookmarks
- Trigger prompt execution from CLI

Release Notes (ver1.6.3):

- Fixed an issue where prompts could not be entered into the text area due to Gemini's TrustedHTML restrictions.
- Updated selectors such as the model selection button to keep up with changes to the Google Gemini UI.

Release Notes (ver1.6.2):

- Fixed an issue where the extension could wait too long for Google Gemini to finish initializing.

Release Notes (ver1.6.1):

- Fixed an issue where the model switching button could not be found in the Google Gemini UI.

Release Notes (ver1.6.0):

- Added an options page to allow changing CSS selectors for identifying UI elements on the Gemini site, in preparation for site design changes.
- Fixed an issue where the model switching button could not be found in the Google Gemini UI.

Release Notes (ver1.5.3):

- Fixed an issue where prompts were not executed automatically in some cases.
- Fixed an issue where the copy button for responses could trigger the menu even when it was located outside the menu area.

Release Notes (ver1.5.2):

- Fixed an issue where the model switching button could not be found in the Google Gemini UI.

Release Notes (ver1.5.1):

- Fixed an issue where the model switching button could not be found in the Google Gemini UI.

Release Notes (ver1.5.0):

- Displayed a message recommending the fragment format for parameter specification over the query parameter format.
- Updated the URL generation option to remember its selected state.
- Improved the internal design.
- Fixed an issue where the model could not be switched if the model name contained full-width parentheses unless it was an exact match.

Release Notes (ver1.4.1):

- Added support for fragment-style (#) parameter specification to improve privacy.
- Introduced an experimental redirect page to prevent prompts from being sent to the server when the URL is opened in an environment without the extension installed.
- Added an option to prevent automatic prompt execution when not logged into Gemini.
- Fixed an issue where the UI could no longer be operated due to changes in Gemini's interface.

Release Notes (ver1.3.0):

- Supports sending multiple prompts consecutively by combining the ext-send parameter with multiple ext-q parameters.
- Updated the extension icon to display the progress of automated operations.

Attribution:

Google Gemini™ is a trademark of Google LLC.
