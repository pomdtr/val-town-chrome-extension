import browser from "webextension-polyfill";

enum actionMenuIds {
  Home = "val-town-home",
  Docs = "val-own-docs",
  Interval = "val-town-intervals",
  Secrets = "val-town-secrets",
}

browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: actionMenuIds.Home,
    title: "Go to Home",
    contexts: ["action"],
  });

  browser.contextMenus.create({
    id: actionMenuIds.Docs,
    title: "Go to Docs",
    contexts: ["action"],
  });

  browser.contextMenus.create({
    id: actionMenuIds.Interval,
    title: "Go to Intervals",
    contexts: ["action"],
  });

  browser.contextMenus.create({
    id: actionMenuIds.Secrets,
    title: "Go to Secrets",
    contexts: ["action"],
  });
});

browser.omnibox.onInputEntered.addListener((text) => {
  browser.tabs.create({
    url: `https://api.val.town/v1/eval/${encodeURIComponent(text)}`,
  });
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case actionMenuIds.Home:
      browser.tabs.create({
        url: "https://val.town",
        index: tab && tab.index + 1,
      });
      return;
    case actionMenuIds.Docs:
      browser.tabs.create({
        url: "https://docs.val.town",
        index: tab && tab.index + 1,
      });
      return;
    case actionMenuIds.Interval:
      browser.tabs.create({
        url: "https://val.town/settings/intervals",
        index: tab && tab.index + 1,
      });
      return;
    case actionMenuIds.Secrets:
      browser.tabs.create({
        url: "https://val.town/settings/secrets",
        index: tab && tab.index + 1,
      });
  }
});

// @ts-ignore
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
