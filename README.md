# Chrome Extension for Val Town

Run vals from a command palette.

![demo](doc/demo.png)

## Installation

1. Download the latest release from the [releases page](https://github.com/pomdtr/val-town-web-extension/releases/latest).
2. Unzip the file.
3. Open the [extensions page](chrome://extensions) in Chrome.
4. Enable developer mode.
5. Click "Load unpacked" and select the unzipped folder.

## Configuration

1. Open the extension options
    ![action right click menu](doc/options.png)
2. Add you val.town token, and the slug of a val containing the configuration you want to use (you can use <https://val.town/v/pomdtr/extension_config> as a starting point).

```jsonc
{
    "token": "<your token>",
    "root": "pomdtr/extension_config",
}
```

Your configuration should expose a list of commands you want to be shown in the root page.

```typescript
export default [
  {
    title: "Convert to Image",
    val: "pomdtr/val2img",
    patterns: ["https://www.val.town/v/*/*"],
  },
  {
    title: "Edit Config",
    icon: "adjustments-horizontal",
    val: "pomdtr/open_url",
    params: {
      url: "https://www.val.town/v/pomdtr/extension_config",
    },
  },
  {
    title: "Search Home Vals",
    icon: "home",
    val: "pomdtr/search_user_vals",
    params: { user: "8a86e3e7-cae8-48ea-a1d8-c8cf7b30d88c" },
  },
  {
    title: "Search Web Vals",
    icon: "globe-alt",
    val: "pomdtr/search_tagged_val",
    params: { tag: "#web" },
  },
  {
    title: "Search Blobs",
    icon: "document",
    val: "pomdtr/search_blobs",
  }
];
```

Since the config is stored as a val, you can easily share it with others, and compose them together.

```typescript
import pomdtrConfig from "https://www.val.town/v/pomdtr/extension_config";

export default [
    ...pomdtrConfig,
    {
      title: "Search Std Vals",
      icon: "magnifying-glass",
      val: "pomdtr/search_user_vals",
      params: { user: "c9143560-63b6-444f-8f9f-e2647fabe09f" },
    },
]
```

## Usage

Use <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> (or <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> on Mac) to open the command palette.

A list of items will be shown. One or more commands will be available for each item. Use <kbd>Enter</kbd> to run the primary command, or <kbd>Tab</kbd> to cycle through the available commands.

## Development

> ⚠️ The extension API is still beeing worked on, and the extension may break at any time.

The extension is built around the idea of "commands". A command is a function that takes a `BrowserContext` and returns an `Action`.

There are 4 types of actions:

- `open`: Open a new tab with the given URL.
- `copy`: Copy the given text to the clipboard.
- `push`: Push a new list of commands to the command stack.
- `close`: Close the command palette.

The `BrowserContext` is javascript object that contains the following properties:

- `url`: The url that was active when the command palette was opened.
- `params`: The parameters passed to the command.

Here is an example of a command that create a new val, and open it in a new tab:

```javascript
import { api } from "https://esm.town/v/pomdtr/api"
import { BrowserContext } from "https://esm.town/v/pomdtr/browser"

export default function(ctx: BrowserContext) {
    const code = ctx.params.code;
    const val = await api("/v1/vals", {
        method: "POST",
        body: JSON.stringify({
            code
        }),
    });

    return {
        type: "open",
        url: `https://val.town/v/${val.author.username}/${val.name}`
    };
}
```

You can reference it from your configuration val:

```typescript
export default [
    {
        name: "Create a new val",
        icon: "plus", // icon list: https://heroicons.com/
        val: "pomdtr/create_val",
        params: {
            code: `console.log("Hello, world!")`
        }
    },
]
```

You can also use the `push` action to add a new list to the navigation stack.

```ts
import { BrowserContext } from "https://esm.town/v/pomdtr/browser";
import { valToListItem } from "https://esm.town/v/pomdtr/val_to_listitem";

export default async function(ctx: BrowserContext<{ user: string }>) {
  const { user: userID } = ctx.params;
  const resp = await fetch(`https://api.val.town/v1/users/${userID}/vals?limit=100`, {
    headers: {
      Authorization: `Bearer ${Deno.env.get("valtown")}`,
    },
  });
  if (!resp.ok) {
    throw new Error(await resp.text());
  }

  const { data: vals } = await resp.json();
  const items = vals.map(valToListItem);

  return {
    type: "push",
    page: {
      type: "list",
      items,
    },
  };
}
```

An array of commands references can be attached to each list item, allowing you to share / reuse commands for difference usecases.

```typescript
export function valToListItem(val) {
  return {
    title: `${val.author.username}/${val.name}`,
    icon: "command-line",
    commands: [
      {
        title: "Open",
        val: "pomdtr/open_url",
        params: {
          url: `https://www.val.town/v/${val.author.username}/${val.name}`,
          replace: true,
        },
      },
      {
        title: "Open in Full Screen",
        val: "pomdtr/open_url",
        params: {
          url: `https://www.val.town/embed/${val.author.username}/${val.name}`,
          replace: true,
        },
      },
      {
        title: "Copy Http Endpoint",
        val: "pomdtr/copy_text",
        params: {
          text: `http://${val.author.username}-${val.name}.web.val.run`,
        },
      },
      {
        title: "Copy Slug",
        val: "pomdtr/copy_text",
        params: {
          text: `${val.author.username}/${val.name}`,
        },
      },
      {
        title: "View References",
        val: "pomdtr/search_val_references",
        params: {
          author: val.author.username,
          name: val.name,
        },
      },
    ],
  };
}
```

