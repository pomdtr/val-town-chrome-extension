import browser from "webextension-polyfill";
import { Config, defaultConfig, MenuItem } from "./config";

const vals: Record<string, string> = {};
function createMenuItem(id: string, item: MenuItem) {
  if (item.val) {
    vals[id] = item.val;
  }

  browser.contextMenus.create({
    id,
    title: item.title,
    documentUrlPatterns: item.patterns,
  });

  for (const [idx, child] of item.children?.entries() || []) {
    createMenuItem(`${id}.${idx}`, child);
  }
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

  for (const [idx, item] of config.contextMenus.entries()) {
    createMenuItem(`${idx}`, item);
  }
});

browser.storage.sync.onChanged.addListener(async (changes) => {
  if (!changes.config) return;
  const config = JSON.parse(changes.config.newValue) as Config;
  await browser.contextMenus.removeAll();
  for (const item of config.contextMenus) {
    createMenuItem(item.title, item);
  }
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
  const val = vals[info.menuItemId];
  const [owner, name] = val.slice(1).split("/");
  let code: string;
  try {
    const resp = await fetch(`https://esm.town/v/${owner}/${name}`);
    if (!resp.ok) {
      throw new Error(`${resp.status} ${resp.statusText}`);
    }
    code = await resp.text();
  } catch (e) {
    console.error(e);
    return;
  }

  browser.scripting.executeScript({
    target: { tabId: tab.id },
    // @ts-ignore
    world: "MAIN",
    func: async (code: string) => {
      const script = document.createElement("script");
      script.type = "module";
      script.text = code;
      document.head.appendChild(script);
    },
    args: [code],
  });
});
