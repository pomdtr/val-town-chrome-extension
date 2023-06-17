import browser from "webextension-polyfill";

browser.omnibox.onInputEntered.addListener((text) => {
  browser.tabs.create({
    url: `https://api.val.town/v1/eval/${encodeURIComponent(text)}`,
  });
});
