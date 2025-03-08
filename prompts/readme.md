The following text should be output as is, with no changes.

# Prompt Runner for Google Gemini

This extension sets up the Google Gemini web app according to URL parameters.

## Use Cases

* Register frequently used models and prompts as bookmarks
* Trigger prompt execution from the CLI

## Instructions

```plaintext
https://how-to-use
    ?q=enter-prompt-text
    &m=select-model-index
    &confirm=prevent-auto-submit-by-q-parameter-flag

Ctrl + C / Cmd + C: Copy the last answer
```

| Parameter | Description | Value |
| --- | --- | --- |
| `q` | Prompt string to execute | URL-encoded text |
| `m` | Index of the model to select | Integer starting from 0 (display order in UI) |
| `confirm` | Suppress auto-submit by `q` parameter | `true/false` or `0/1` |

## Attribution

Google Gemini™ is a trademark of Google LLC.
