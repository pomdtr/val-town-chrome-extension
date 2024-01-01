import browser from "webextension-polyfill";
import { Config, defaultConfig, MenuItem } from "./config";

function createMenuItem(id: string, item: MenuItem): Record<string, MenuItem> {
  browser.contextMenus.create({
    id,
    title: item.title,
    contexts: ["link"],
    targetUrlPatterns: ["https://www.val.town/v/*"],
  });

  if (item.url) {
    return { [id]: item };
  }

  let vals: Record<string, MenuItem> = {};
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
  console.log("config", config);

  let vals = {};
  for (const [idx, item] of config.contextMenus.entries()) {
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

  const storage = await browser.storage.local.get(["config", "vals"]);
  const config = JSON.parse(storage.config || "{}") as Config;
  if (!config.token) {
    console.error("no token");
    return;
  }

  const vals = storage.vals as Record<string, MenuItem>;
  const val = vals[info.menuItemId];
  if (!val.url) {
    console.error("no val for", info.menuItemId);
    console.error(`vals`, vals);
    return;
  }

  const url = new URL(val.url);
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
  console.log(val);

  browser.scripting.executeScript({
    target: { tabId: tab.id },
    // @ts-ignore
    world: "MAIN",
    func: async (code: string, ctx: Record<string, any>) => {
      function injectScript(code: string) {
        const script = document.createElement("script");
        script.type = "module";
        script.text = code;
        document.head.appendChild(script);
      }
      injectScript(
        `window.valtown = ${JSON.stringify(ctx)};\n${code}`,
      );
    },
    args: [code, {
      token: config.token,
      config: val.config,
      url: info.linkUrl || info.pageUrl,
    }],
  });
});
