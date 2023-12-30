# Chrome Extension for Val Town

Run vals from the browser context menu.

![demo](./doc/screenshot.png)

## Installation

1. Download the latest release from the [releases page](https://github.com/pomdtr/val-town-web-extension/releases/latest).
2. Unzip the file.
3. Open the [extensions page](chrome://extensions) in Chrome.
4. Enable developer mode.
5. Click "Load unpacked" and select the unzipped folder.

## Usage

Create a new val in val.town containing client-side javascript.

```javascript
await navigator.clipboard.writeText(`[${document.title}](${location.href})`);
```

Make sure that your val is either public or unlisted.

Then, click on the extension icon to open the options, and add your item to the `contextMenus` list.

```json
{
  "contextMenus": [
    {
      "title": "Copy Markdown Link",
      "val": "@pomdtr/copy_markdown_link",
    }
  ]
}
```

The following properties are available:

- `title`: The title of the context menu item.
- `val`: The full name of the val to run (`@owner/val_name`).
- `patterns`: An array of URL patterns to match against the current page. If the current page does not match any of the patterns, the context menu item will not be shown. If omitted, the context menu item will be shown on all pages.
- `children`: An array of child context menu items. Cannot be used with `val`.

## Why is my val not working on (Twitter / Github / ...) ?

This extension inject a script in the page head when a context menu item is clicked. This script reference the esm.town url of the val. If the website you are trying to run the val on does not allow scripts from esm.town, the val will not work.
