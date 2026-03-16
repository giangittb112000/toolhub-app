# Web-to-Markdown Module

This module allows users to convert web page content into clean Markdown, optimized for consumption by AI agents or for personal archiving.

## Features

- **URL Extraction**: Cleanly extracts the main content from any URL.
- **Noise Removal**: Automatically removes headers, footers, sidebars, and advertisements.
- **Markdown Conversion**: Converts standard HTML structures into readable Markdown.
- **Copy to Clipboard**: One-click copying of the generated Markdown content.
- **AI-Ready**: Generates output that is easy for LLMs to parse and understand.

## How to Use

1. **Enter URL**: Paste the link of the website you want to convert into the input field.
2. **Validate**: The tool will check if the URL format is valid.
3. **Convert**: Click the "Convert" button to start the extraction process.
4. **Preview**: Review the generated Markdown in the preview area.
5. **Copy**: Click the copy icon to save the content to your clipboard.

## Technology

- **Engine**: Powered by [defuddle](https://github.com/kepano/defuddle).
- **Backend**: Processed in the Electron Main process to circumvent CORS restrictions.
- **Frontend**: Built with React and Tailwind CSS.
