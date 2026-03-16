# Web-to-Markdown Backend Module

This module handles the core logic of fetching web page content and converting it to Markdown within the Electron Main process.

## Architecture

We perform the conversion in the **Main Process** for the following reasons:
1.  **CORS Bypass**: To fetch content from any external URL without being blocked by browser Cross-Origin Resource Sharing policies.
2.  **Performance**: Offloading heavy DOM parsing and conversion tasks from the UI thread.
3.  **Stability**: Access to Node.js native features if needed by the parsing libraries.

## Dependencies

-   **[defuddle](https://github.com/kepano/defuddle)**: The primary extraction engine. It uses sophisticated algorithms to identify the "main" content of a page and converts it to clean Markdown.
-   **[jsdom](https://github.com/jsdom/jsdom)**: Since `defuddle` is designed to work with the browser's DOM, `jsdom` provides a robust, Node.js-based implementation of the WHATWG DOM and HTML standards for the conversion logic to run outside a browser.

## IPC Communication

The module registers the following handler in `registerHandlers(router)`:

-   **Channel**: `web-to-md:convert`
-   **Input**: `{ url: string }`
-   **Output**: 
    ```ts
    {
      success: boolean;
      markdown?: string;
      title?: string;
      error?: string;
    }
    ```

## Logic Flow

1.  **Fetch**: Uses the global `fetch` API to retrieve the raw HTML from the target URL.
2.  **DOM Creation**: Initializes a `JSDOM` instance with the fetched HTML.
3.  **Extraction**: Passes the `jsdom` document to `defuddle` to extract the main content and generate Markdown.
4.  **Response**: Returns the generated Markdown and the page title back to the Renderer process.
