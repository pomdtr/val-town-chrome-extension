import browser from "webextension-polyfill";
import { Config, defaultConfig, MenuItem } from "./config";

function createMenuItem(id: string, item: MenuItem): Record<string, string> {
  browser.contextMenus.create({
    id,
    title: item.title,
    contexts: ["page"],
    documentUrlPatterns: ["https://www.val.town/v/*"],
  });

  if (item.url) {
    return { [id]: item.url };
  }

  let vals: Record<string, string> = {};
  for (const [idx, child] of item.children?.entries() || []) {
    const res = createMenuItem(`${id}.${idx}`, child);
    vals = { ...vals, ...res };
  }

  return vals;
}

browser.runtime.onInstalled.addListener(async () => {
  let storage = await browser.storage.sync.get(["config"]);
  let config: Config;
  if (storage.config) {
    config = JSON.parse(storage.config);
  } else {
    config = defaultConfig;
  }
  console.log("config", config);

  let vals = {};
  for (const [idx, item] of config.contextMenus.entries()) {
    const val = createMenuItem(`${idx}`, item);
    vals = { ...vals, ...val };
  }

  await browser.storage.local.set({ vals });
});

browser.storage.sync.onChanged.addListener(async (changes) => {
  if (!changes.config) return;
  const config = JSON.parse(changes.config.newValue) as Config;
  await browser.contextMenus.removeAll();

  let vals = {};
  for (const item of config.contextMenus) {
    const val = createMenuItem(item.title, item);
    vals = { ...vals, ...val };
  }

  await browser.storage.local.set({ vals });
});

browser.action.onClicked.addListener(async () => {
  await browser.tabs.create({
    url: "chrome://extensions/?options=" + browser.runtime.id,
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) {
    console.error("no tab id");
    return;
  }

  const storage = await browser.storage.sync.get(["config"]);
  const config = JSON.parse(storage.config || "{}") as Config;
  if (!config.token) {
    console.error("no token");
    return;
  }

  const { vals } = await browser.storage.local.get(["vals"]);
  const rawUrl = vals[info.menuItemId];
  if (!rawUrl) {
    console.error("no val for", info.menuItemId);
    console.error(`vals`, vals);
    return;
  }
  const url = new URL(rawUrl);
  if (!(url.origin == "https://esm.town")) {
    console.error("invalid origin", url.origin);
    return;
  }

  const resp = await fetch(url, {
    headers: {
      authorization: `Bearer ${config.token}`,
    },
  });
  if (!resp.ok) {
    console.error("resp not ok", resp);
    return;
  }
  const code = await resp.text();

  browser.scripting.executeScript({
    target: { tabId: tab.id },
    // @ts-ignore
    world: "MAIN",
    func: async (code: string, token: string) => {
      if (!document.getElementById("valtown-ctx")) {
        const script = document.createElement("script");
        script.id = "valtown-ctx";
        script.type = "module";
        script.text = `window.valtown = { token: "${token}" }`;
        document.head.appendChild(script);
      }
      const script = document.createElement("script");
      script.type = "module";
      script.text = code;
      document.head.appendChild(script);
    },
    args: [code, config.token],
  });
});
