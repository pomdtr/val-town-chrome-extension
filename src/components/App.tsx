import React from "react";
import { Command } from "cmdk";
import "./App.scss";
import type {
  Config,
  List,
  ListItem,
  CommandRef,
  Action,
  BrowserContext,
} from "~/config";
import { useList } from "@uidotdev/usehooks";
import * as icons from "@heroicons/react/24/outline";

const storage = await chrome.storage.local.get(["config"]);
const config = JSON.parse(storage.config) as Config;

const code = `
async (url, ctx) => {
  try {
    const { default: handler } = await import(url);
    return await handler(ctx);
  } catch (e) {
    return { error: e.message };
  }
}
`;

async function extractRootCommands(val: string): Promise<CommandRef[]> {
  const valUrl = `https://esm.town/v/${val}`;
  const resp = await fetch("https://api.val.town/v1/eval", {
    method: "POST",
    body: JSON.stringify({
      code: `async (url) => await import(url).then(module => module.default);`,
      args: [valUrl],
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.token}`,
    },
  });

  if (!resp.ok) {
    throw new Error(`Failed to run val: ${await resp.text()}`);
  }

  return resp.json();
}

async function runVal<T extends Object = any>(
  val: string,
  ctx?: Record<string, any>
) {
  const valUrl = `https://esm.town/v/${val}`;
  const resp = await fetch("https://api.val.town/v1/eval", {
    method: "POST",
    body: JSON.stringify({
      code,
      args: [valUrl, ctx],
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.token}`,
    },
  });

  if (!resp.ok) {
    throw new Error(`Failed to run val: ${await resp.text()}`);
  }

  const output = (await resp.json()) as T | { error: string };
  if ("error" in output) {
    throw new Error(output.error);
  }

  return output as T;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const port = chrome.runtime.connect({ name: "popup" });

const CommandPalette = () => {
  const [pages, { push, removeAt }] = useList<List>([]);
  const [url, setUrl] = React.useState<string>();
  const [error, setError] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [value, setValue] = React.useState("");
  const currentPage = pages[pages.length - 1];
  const focusedItem = currentPage?.items.find(
    (item) => item.title.trim().toLowerCase() === value
  );

  React.useEffect(() => {
    const listener = (msg: any) => {
      console.log("worker -> popup", msg);
      switch (msg.type) {
        case "get-url": {
          setUrl(msg.url || "unknown");
          break;
        }
      }
    };
    port.onMessage.addListener(listener);

    return () => {
      port.onMessage.removeListener(listener);
    };
  }, []);

  React.useEffect(() => {
    async function init() {
      if (!url) {
        console.log("sending message");
        await port.postMessage({ type: "get-url" });
        return;
      }

      console.log("running val", config.root);
      const commands = await extractRootCommands(config.root);
      const items: ListItem[] = commands
        .filter((command) => {
          if (!command.patterns) {
            return true;
          }

          for (const pattern of command.patterns) {
            // @ts-ignore
            if (new URLPattern(pattern).test(url)) {
              return true;
            }
          }

          return false;
        })
        .map((command) => ({
          title: command.title,
          icon: command.icon || "play",
          commands: [
            {
              title: "Run Action",
              val: command.val,
              icon: "play",
              params: command.params || {},
            },
            {
              title: "Open Val",
              val: "pomdtr/open_url",
              icon: "link",
              params: {
                url: `https://val.town/v/${command.val}`,
              },
            },
            {
              title: "Copy Val Url",
              val: "pomdtr/copy_text",
              icon: "clipboard",
              params: {
                text: `https://val.town/v/${command.val}`,
              },
            },
          ],
        }));

      setIsLoading(false);
      push({
        type: "list",
        items,
      });
    }

    init();
  }, [url]);

  React.useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      // when tab is pressed, show the actions
      if (e.key === "Tab") {
        e.preventDefault();
        if (!focusedItem) {
          return;
        }
        setSearch("");
        push({
          type: "list",
          items:
            focusedItem?.commands?.map((command) => ({
              title: command.title,
              icon: command.icon,
              commands: [command],
            })) || [],
        });
      }
    };

    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [push, focusedItem, setSearch]);

  return (
    <Command value={value} onValueChange={setValue}>
      <Command.Input
        placeholder={
          isLoading ? undefined : currentPage.placeholder || "Search..."
        }
        autoFocus
        onBlur={(e) => {
          e.target.focus();
        }}
        value={search}
        onValueChange={setSearch}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();

            if (search.length > 0) {
              setSearch("");
              return;
            }

            if (pages.length > 1) {
              removeAt(pages.length - 1);
              return;
            }

            window.close();
            return;
          }
        }}
      />
      <Command.List>
        {(() => {
          if (error) {
            return <Command.Loading>{error}</Command.Loading>;
          }
          if (isLoading) {
            return <Command.Loading>Loading...</Command.Loading>;
          }
          if (!currentPage.items.length) {
            return <Command.Empty>No results</Command.Empty>;
          }

          return currentPage?.items.map((item, idx) => (
            <Item
              key={idx}
              item={item}
              onSelect={async () => {
                if (!item.commands?.length) {
                  return;
                }

                const primary = item.commands[0];
                setIsLoading(true);
                setSearch("");

                let slug = primary.val;
                if (slug?.startsWith("@")) {
                  slug = slug.slice(1);
                }

                console.log("running val", primary.val);
                let action: Action;
                try {
                  const ctx: BrowserContext = {
                    url,
                    params: primary.params || {},
                  };
                  action = await runVal<Action>(primary.val, ctx);
                } catch (e) {
                  setError((e as Error).message);
                  return;
                }

                console.log("action", action);

                switch (action.type) {
                  case "push": {
                    push(action.page);
                    break;
                  }
                  case "open": {
                    await port.postMessage({
                      type: "open-url",
                      url: action.url,
                    });
                    window.close();
                    break;
                  }
                  case "copy": {
                    await navigator.clipboard.writeText(action.text);
                    await sleep(50);
                    window.close();
                    break;
                  }
                  case "close": {
                    window.close();
                    break;
                  }
                }
                setIsLoading(false);
              }}
            />
          ));
        })()}
      </Command.List>
    </Command>
  );
};

function hyphenToPascalCase(str: string) {
  return str
    .replace(/-([a-z])/g, function (_, letter) {
      return letter.toUpperCase();
    })
    .replace(/^\w/, (c) => c.toUpperCase());
}

function Item({ item, onSelect }: { item: ListItem; onSelect: () => void }) {
  const iconKey = hyphenToPascalCase(item.icon || "") + "Icon";
  const Icon = icons[iconKey as keyof typeof icons];
  return (
    <Command.Item value={item.title} onSelect={onSelect}>
      {Icon ? <Icon /> : undefined}
      {item.title}
    </Command.Item>
  );
}

function Action({
  action,
  onSelect,
}: {
  action: CommandRef;
  onSelect: () => void;
}) {
  return (
    <Command.Item value={action.title} onSelect={onSelect}>
      {action.title}
    </Command.Item>
  );
}

export default CommandPalette;
