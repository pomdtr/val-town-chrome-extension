import browser from "webextension-polyfill";
import { Action, Config, defaultConfig } from "./config";

function createMenuItem(id: string, item: Action): Record<string, Action> {
  browser.contextMenus.create({
    id,
    title: item.title,
    contexts: ["link"],
    targetUrlPatterns: ["https://www.val.town/v/*"],
  });

  if (item.url) {
    return { [id]: item };
  }

  let vals: Record<string, Action> = {};
  for (const [idx, child] of item.children?.entries() || []) {
    const res = createMenuItem(`${id}.${idx}`, child);
    vals = { ...vals, ...res };
  }

  vals[id] = item;
  return vals;
}

browser.runtime.onInstalled.addListener(async () => {
  let storage = await browser.storage.local.get(["config"]);
  let config: Config;
  if (storage.config) {
    config = JSON.parse(storage.config);
  } else {
    config = defaultConfig;
  }

  await browser.contextMenus.removeAll();
  let vals = {};
  for (const [idx, item] of config.actions?.entries() || []) {
    const val = createMenuItem(`${idx}`, item);
    vals = { ...vals, ...val };
  }

  await browser.storage.local.set({ vals });
});

browser.storage.local.onChanged.addListener(async (changes) => {
  if (!changes.config) return;
  const config = JSON.parse(changes.config.newValue) as Config;
  await browser.contextMenus.removeAll();

  let vals = {};
  for (const item of config.actions || []) {
    const val = createMenuItem(item.title, item);
    vals = { ...vals, ...val };
  }

  await browser.storage.local.set({ vals });
});

browser.action.onClicked.addListener(async () => {
  await browser.tabs.create({
    url: `https://www.val.town/search?q=${encodeURIComponent("#web")}`,
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) {
    console.error("no tab id");
    return;
  }

  const storage = await browser.storage.local.get(["config", "vals"]);
  const config = JSON.parse(storage.config || "{}") as Config;
  if (!config.token) {
    console.error("no token");
    return;
  }

  const actions = storage.vals as Record<string, Action>;
  const action = actions[info.menuItemId];
  if (!action.url) {
    console.error("no val for", info.menuItemId);
    console.error(`vals`, actions);
    return;
  }

  browser.scripting.executeScript({
    target: { tabId: tab.id },
    // @ts-ignore
    world: "MAIN",
    func: async (action: Action, ctx: Record<string, any>) => {
      function injectScript(code: string) {
        const script = document.createElement("script");
        script.type = "module";
        script.text = code;
        document.head.appendChild(script);
      }
      injectScript(
        `
import { default as handler } from "${action.url}";

await handler(${JSON.stringify(ctx)});
`.trimStart(),
      );
    },
    args: [action, {
      token: config.token,
      config: action.config,
      url: info.linkUrl || info.pageUrl,
    }],
  });
});
