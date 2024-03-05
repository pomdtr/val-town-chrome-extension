import React, { useEffect } from "react";
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

function sendMessage(msg: any): Promise<any> {
  console.log("sendMessage", msg);
  return new Promise((resolve) => {
    const listener = (msg: any) => {
      port.onMessage.removeListener(listener);
      resolve(msg);
    };

    port.onMessage.addListener(listener);
    port.postMessage(msg);
  });
}

function getTabUrl(): Promise<string> {
  return sendMessage({ type: "get-tab-url" });
}

const CommandPalette = () => {
  const [root, setRoot] = React.useState<List>();
  useEffect(() => {
    async function init() {
      const commands = await extractRootCommands(config.root);
      const tabUrl = await getTabUrl();
      console.log("tabUrl", tabUrl);

      const items: ListItem[] = commands
        .filter((command) => {
          if (!command.patterns) {
            return true;
          }

          for (const pattern of command.patterns) {
            // @ts-ignore
            const match = new URLPattern(pattern).exec(tabUrl);
            if (!match) {
              continue;
            }

            for (const [k, v] of Object.entries({
              ...match.hostname.groups,
              ...match.pathname.groups,
            })) {
              if (!command.params) {
                command.params = {};
              }
              command.params[k] = v;
            }

            return true;
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

      setRoot({
        type: "list",
        items,
      });
    }

    init();
  }, []);
  if (!root) {
    return (
      <Command>
        <Command.Input disabled />
        <Command.List>
          <Command.Loading>Loading...</Command.Loading>
        </Command.List>
      </Command>
    );
  }

  return (
    <Page
      page={root}
      pop={() => {
        window.close();
      }}
    />
  );
};

function Page(props: { page: List; pop: () => void }) {
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string>();
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [child, setChild] = React.useState<List>();
  const [showCommands, setShowCommands] = React.useState(false);
  const [commandSearch, setCommandSearch] = React.useState("");

  const focusedItem = props.page.items.find(
    (item) => item.title.trim().toLowerCase() === value
  );

  async function handleCommand(command: CommandRef) {
    setIsLoading(true);

    let slug = command.val;
    if (slug?.startsWith("@")) {
      slug = slug.slice(1);
    }

    console.log("running val", command.val);
    let action: Action;
    try {
      const ctx: BrowserContext = {
        url: await getTabUrl(),
        params: command.params || {},
      };
      action = await runVal<Action>(command.val, ctx);
    } catch (e) {
      setError((e as Error).message);
      return;
    }

    console.log("action", action);

    switch (action.type) {
      case "push": {
        setChild(action.page);
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
  }

  React.useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (child) {
        return;
      }

      // when tab is pressed, show the actions
      if (e.key === "Tab") {
        e.preventDefault();
        if (!focusedItem) {
          return;
        }
      }
    };

    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [child, focusedItem]);

  if (child) {
    return (
      <Page
        page={child}
        pop={() => {
          setChild(undefined);
        }}
      />
    );
  }

  if (showCommands) {
    return (
      <Command>
        <Command.Input
          placeholder="Search Commands..."
          value={commandSearch}
          onValueChange={setCommandSearch}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();

              if (commandSearch.length > 0) {
                setCommandSearch("");
                return;
              }

              setShowCommands(false);
            }
          }}
        />
        <Command.List>
          {focusedItem?.commands?.map((command, idx) => (
            <Item
              key={idx}
              item={{
                title: command.title,
                icon: command.icon,
                commands: [command],
              }}
              onSelect={async () => {
                setShowCommands(false);
                handleCommand(command);
              }}
            />
          ))}
        </Command.List>
      </Command>
    );
  }

  return (
    <Command value={value} onValueChange={setValue}>
      <Command.Input
        autoFocus
        onBlur={(e) => {
          e.target.focus();
        }}
        value={search}
        onValueChange={setSearch}
        placeholder={isLoading ? undefined : "Search Items..."}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();

            if (search.length > 0) {
              setSearch("");
              return;
            }

            props.pop();
            return;
          }

          if (e.key === "Tab") {
            e.preventDefault();
            e.stopPropagation();
            setShowCommands(true);
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

          if (!props.page.items.length) {
            return <Command.Empty>No results</Command.Empty>;
          }

          return props.page.items.map((item, idx) => (
            <Item
              key={idx}
              item={item}
              onSelect={async () => {
                if (!item.commands?.length) {
                  return;
                }

                handleCommand(item.commands[0]);
              }}
            />
          ));
        })()}
      </Command.List>
    </Command>
  );
}

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

export default CommandPalette;
