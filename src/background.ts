import browser from "webextension-polyfill";

enum contextMenuIds {
  Home = "val-town-home",
  Docs = "val-own-docs",
  Interval = "val-town-intervals",
  Secrets = "val-town-secrets",
  OpenInValTown = "open-in-val-town",
  OpenExpressEndpoint = "open-express-endpoint",
  OpenRunEndpoint = "open-run-endpoint",
}

chrome.tabs.onUpdated.addListener(async (tabId, _, tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);
  // Enables the side panel on google.com
  if (url.origin === "https://www.val.town") {
    // @ts-ignore
    await chrome.sidePanel.setOptions({
      tabId,
      path: "src/playground.html",
      enabled: true,
    });
  }
});

// async function addToClipboard(value: string) {
//   await chrome.offscreen.createDocument({
//     url: "offscreen.html",
//     reasons: [chrome.offscreen.Reason.CLIPBOARD],
//     justification: "Write text to the clipboard.",
//   });

//   // Now that we have an offscreen document, we can dispatch the
//   // message.
//   chrome.runtime.sendMessage({
//     type: "copy-data-to-clipboard",
//     target: "offscreen-doc",
//     data: value,
//   });
// }

browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: contextMenuIds.Home,
    title: "Go to Home",
    contexts: ["action"],
  });

  browser.contextMenus.create({
    id: contextMenuIds.Docs,
    title: "Go to Docs",
    contexts: ["action"],
  });

  browser.contextMenus.create({
    id: contextMenuIds.Interval,
    title: "Go to Intervals",
    contexts: ["action"],
  });

  browser.contextMenus.create({
    id: contextMenuIds.Secrets,
    title: "Go to Secrets",
    contexts: ["action"],
  });

  browser.contextMenus.create({
    id: contextMenuIds.OpenInValTown,
    title: "Open in Val Town",
    contexts: ["page"],
    documentUrlPatterns: [
      "https://*.express.val.run/*",
      "https://api.val.town/v1/run/*",
    ],
  });

  browser.contextMenus.create({
    id: contextMenuIds.OpenExpressEndpoint,
    title: "Open Express Endpoint",
    contexts: ["link"],
    targetUrlPatterns: ["https://www.val.town/v/*.*"],
  });

  browser.contextMenus.create({
    id: contextMenuIds.OpenRunEndpoint,
    title: "Open Run Endpoint",
    contexts: ["link"],
    targetUrlPatterns: ["https://www.val.town/v/*.*"],
  });
});

browser.omnibox.onInputEntered.addListener((text) => {
  browser.tabs.create({
    url: `https://api.val.town/v1/eval/${encodeURIComponent(text)}`,
  });
});

function extractVal(url: string): [string, string] | null {
  const val = url.split("/").pop();
  if (!val) return null;

  const [owner, valName] = val.split(".");

  return [owner, valName];
}

browser.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case contextMenuIds.Home:
      browser.tabs.create({
        url: "https://val.town",
        index: tab && tab.index + 1,
      });
      return;
    case contextMenuIds.Docs:
      browser.tabs.create({
        url: "https://docs.val.town",
        index: tab && tab.index + 1,
      });
      return;
    case contextMenuIds.Interval:
      browser.tabs.create({
        url: "https://val.town/settings/intervals",
        index: tab && tab.index + 1,
      });
      return;
    case contextMenuIds.Secrets:
      browser.tabs.create({
        url: "https://val.town/settings/secrets",
        index: tab && tab.index + 1,
      });
      return;
    case "open-in-val-town": {
      if (!info.pageUrl) return;
      const url = new URL(info.pageUrl);

      if (url.hostname === "api.val.town") {
        const val = url.pathname.split("/").pop();
        browser.tabs.create({
          url: `https://val.town/v/${val}`,
          index: tab && tab.index + 1,
        });
        return;
      } else {
        const val = url.hostname.split(".")[0];
        if (!val) return;

        const [owner, valName] = val.split("-");

        browser.tabs.create({
          url: `https://val.town/v/${owner}.${valName}`,
          index: tab && tab.index + 1,
        });
        return;
      }
    }
    case contextMenuIds.OpenExpressEndpoint: {
      if (!info.linkUrl) return;
      const val = extractVal(info.linkUrl);
      if (!val) return;

      const [owner, valName] = val;
      const expressUrl = `https://${owner}-${valName}.express.val.run`;
      browser.tabs.create({
        url: expressUrl,
        index: tab && tab.index + 1,
      });
      return;
    }

    case contextMenuIds.OpenRunEndpoint: {
      if (!info.linkUrl) return;
      const val = extractVal(info.linkUrl);
      if (!val) return;

      const [owner, valName] = val;
      const runUrl = `https://api.val.town/v1/run/${owner}.${valName}`;
      browser.tabs.create({
        url: runUrl,
        index: tab && tab.index + 1,
      });
      return;
    }
  }
});

// @ts-ignore
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
