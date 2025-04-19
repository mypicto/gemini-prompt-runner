Output the following text, preserving structure, language, and style.

# Prompt Runner for Google Gemini

This extension allows automatic execution of prompts, which is not supported by default, by passing additional URL parameters to the Google Gemini web app.

## Features

* Automatic prompt execution via URL parameters (parameters are not sent to the server and are processed securely within the browser)
  * Replacement of the keyword `{{clipboard}}` in prompts with clipboard text (optional)
  * Automatic prompt submission (optional)
* Model selection via URL parameters
* Generation of URLs usable in Prompt Runner for Google Gemini from the current prompt and selected model
* Copying of the last response when `Ctrl + C` / `Cmd + C` is pressed without text selection (requires a copy button, so a certain window size is necessary)

## Use Cases

* Register prompt templates in bookmarks
* Trigger prompt execution from CLI

## Instructions

Please specify the parameters in the URL of Gemini using **fragment format** starting with `#`, as described below.  
Do **not** use query format like `?key=value`; instead, use `#key=value`.  
Use `&` to separate multiple parameters.

```plaintext
https://how-to-use
    #ext-q=enter-prompt-text
    &ext-m=select-model
    &ext-clipboard=replace-keywords-in-prompt-with-clipboard-text
    &ext-send=auto-send-for-prompt

Ctrl+C / Cmd+C: copy the last answer.
```

> [!WARNING]
> #### Sharing URLs
> Although the extension also works with query format (`?key=value`), **if the extension is not installed**, the prompt may be sent **unencrypted to Gemini's servers**, which can result in it being logged.  
> Even with fragment format (`#key=value`), **parameters may still be exposed to web analytics tools** if the extension is not installed.  
>
> If you're sharing prompts containing sensitive information, it's strongly recommended to replace the domain with  
> [https://mypicto.github.io/gemini-prompt-runner](https://mypicto.github.io/gemini-prompt-runner).  
> This will route users through a secure redirect page that checks for extension availability.  
> *Note: This redirect page is an experimental feature and is not guaranteed to be permanently maintained.*
>
> **Example:**  
> `https://gemini.google.com/app#ext-q=prompt`  
> → `https://mypicto.github.io/gemini-prompt-runner/app#ext-q=prompt`

### Parameters

| Parameter | Description | Value |
| --- | --- | --- |
| `ext-q` | Prompt string to execute | URL-encoded text (insert clipboard text with `{{clipboard}}` keyword) |
| `ext-m` | Index of the model to select | Integer starting from 0 (order as displayed in UI) or model name (as displayed in UI) |
| `ext-clipboard` | Replace the {{clipboard}} keyword in `ext-q` with the clipboard text | `true/false` or `0/1` |
| `ext-send` | Auto-sending for prompt | `true/false` or `0/1` |
| `ext-required-login` | Prevents prompt execution if the user is not logged into Gemini when opening the URL | `true/false` or `0/1` |

> [!TIP]
> By enabling `ext-send` and specifying multiple `ext-q` values, you can send multiple prompts consecutively.

## Examples

* Ask for today's weather forecast

  ```url
  https://gemini.google.com/app#ext-q=Today%27s+weather+forecast.&ext-send=1
  ```

* Start a chat with the 3rd model

  ```url
  https://gemini.google.com/app#ext-m=2
  ```

* Start a chat with Deep Research model

  ```url
  https://gemini.google.com/app#ext-m=DeepResearch
  ```

* Summarize text from clipboard

  ```url
  https://gemini.google.com/app#ext-q=Summarize%20the%20input%20text.%0A%0A**Input%3A**%0A%7B%7Bclipboard%7D%7D&ext-clipboard=1
  ```

## Attribution

Google Gemini™ is a trademark of Google LLC.
