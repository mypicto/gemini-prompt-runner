Output the following text, preserving structure, language, and style.

# Prompt Runner for Google Gemini

This extension allows automatic execution of prompts, which is not supported by default, by passing additional URL parameters to the Google Gemini web app.

## Features

* Automatically execute prompts from URL parameters (parameters are processed securely within the browser and are not sent to the server)
  * Insert clipboard text into the prompt (optional)
  * Disable automatic submission of prompts (optional)
* Select a model from URL parameters
* Copy the last answer by pressing Ctrl + C / Cmd + C when no text is selected

## Use Cases

* Register prompt templates in bookmarks
* Trigger prompt execution from CLI

## Instructions

```plaintext
https://how-to-use
    ?ext-q=enter-prompt-text
    &ext-m=select-model
    &ext-clipboard=flag-to-replace-clipboard-text-in-q-parameter
    &ext-confirm=flag-to-prevent-auto-submit-by-q-parameter

Ctrl+C / Cmd+C: copy the last answer.
```

| Parameter | Description | Value |
| --- | --- | --- |
| `ext-q` | Prompt string to execute | URL-encoded text (insert clipboard text with `{{clipboard}}` keyword) |
| `ext-m` | Index of the model to select | Integer starting from 0 (order as displayed in UI) or model name (as displayed in UI) |
| `ext-clipboard` | Replace the {{clipboard}} keyword in ext-q with the clipboard text. | `true/false` or `0/1` |
| `ext-confirm` | Prevent auto-submit by `ext-q` parameter | `true/false` or `0/1` |

## Attribution

Google Gemini™ is a trademark of Google LLC.
