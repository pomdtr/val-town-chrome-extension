import browser from "webextension-polyfill";
import { Config, defaultConfig, MenuItem } from "./config";

function createMenuItem(id: string, item: MenuItem): Record<string, string> {
  browser.contextMenus.create({
    id,
    title: item.title,
    documentUrlPatterns: item.patterns,
    contexts: ["page", "selection", "link", "image", "video", "audio", "frame"],
  });

  if (item.val) {
    return { [id]: item.val };
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

  const { vals } = await browser.storage.local.get(["vals"]);
  const val = vals[info.menuItemId];
  if (!val) {
    console.error("no val for", info.menuItemId);
    console.error(`vals`, vals);
    return;
  }
  const [owner, name] = val.slice(1).split("/");
  const randInt = Math.floor(Math.random() * 1000000);
  const esmUrl = `https://esm.town/v/${owner}/${name}#${Math.floor(randInt)}`;

  browser.scripting.executeScript({
    target: { tabId: tab.id },
    // @ts-ignore
    world: "MAIN",
    func: async (src: string) => {
      const script = document.createElement("script");
      script.type = "module";
      script.src = src;
      document.head.appendChild(script);
    },
    args: [esmUrl],
  });
});
