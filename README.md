# Gemini Prompt Runner Chrome Extension

This Chrome extension automatically retrieves the 'q' query parameter from the URL and inputs it into the Gemini app's text area.

## Installation

1. Clone or download this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" by toggling the switch in the top right corner.
4. Click on "Load unpacked" and select the directory where you downloaded this extension.

## Usage

- Navigate to a page with the Gemini app.
- Ensure the URL contains a 'q' query parameter (e.g., `https://example.com/?q=your-prompt`).
- The extension will automatically input the query parameter into the Gemini app's text area.

## Error Handling

- If the 'q' query parameter is not found, an error will be logged in the console.
- If the text area is not found, an error will be logged in the console.

## Future Enhancements

- Improve error handling and user feedback.
- Add support for additional query parameters.
