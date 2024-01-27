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
The val privacy must be either "public" or "unlisted".

```javascript
import { BrowserContext } from "https://esm.town/v/pomdtr/browser";
import { extractValInfo } from "https://esm.town/v/pomdtr/extractValInfo";

// Copy the val markdown link to the clipboard.
export default function(ctx: BrowserContext) {
  const { author, name } = extractValInfo(ctx.url);
  await navigator.clipboard.writeText(`[@${author}/${name}](${location.href})`);
}
```

Then, right-click on the extension icon and select the `Options` item to open the settings editor.

You can then add new items to the `actions` list.

```jsonc
{
  "token": "your_token", // required, will be passed to your val
  "actions": [
    {
      "title": "Copy Markdown Link",
      "url": "https://esm.town/v/pomdtr/copy_markdown_link",
    }
  ]
}
```

The context menu actions will appear on all val links (`https://www.val.town/v/*`).

The following properties are available:

- `title`: The title of the context menu item.
- `url`: The url of the script to run.
- `config`: The config to pass to the script.
- `children`: An array of child context menu items. Cannot be used with `url` or `config`.

## Examples

- [Val to Image](https://esm.town/v/pomdtr/val2img)
- [Open Dependency Graph](https://esm.town/v/pomdtr/open_dependency_graph)

## Context

The following properties are available on the context object passed to the val:

- `url`: The url of the val.
- `token`: The valtown token configured in the extension options.
- `config`: The config passed to the val in the extension options.
