Output the following text, preserving structure, language, and style.

# Prompt Runner for Google Gemini

This extension allows automatic execution of prompts, which is not supported by default, by passing additional URL parameters to the Google Gemini web app.

## Features

* Automatically execute prompts from URL parameters (parameters are processed securely without being sent to the server)
  * Insert clipboard text into the prompt
  * Optionally disable automatic submission of prompts
* Select model from URL parameters
* Press `Ctrl + C` / `Cmd + C` keys without selecting text to copy the last answer

## Use Cases

* Register prompt templates in bookmarks
* Trigger prompt execution from CLI

## Instructions

```plaintext
https://how-to-use
    ?ext-q=enter-prompt-text
    &ext-m=select-model-index
    &ext-confirm=flag-to-prevent-auto-submit-by-q-parameter

Ctrl+C / Cmd+C: copy the last answer.
```

| Parameter | Description | Value |
| --- | --- | --- |
| `ext-q` | Prompt string to execute | URL-encoded text |
| `ext-m` | Index of the model to select | Integer starting from 0 (display order in UI) |
| `ext-confirm` | Suppress auto-submit by `ext-q` parameter | `true/false` or `0/1` |

## Attribution

Google Gemini™ is a trademark of Google LLC.
