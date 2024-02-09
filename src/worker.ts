import { ExtensionRequest } from "./msg";

chrome.runtime.onMessage.addListener(async (msg: ExtensionRequest) => {
  console.log("msg", msg);
  switch (msg.type) {
    case "open":
      if (msg.options?.replace) {
        await chrome.tabs.update({ url: msg.url });
      } else {
        await chrome.tabs.create({ url: msg.url });
      }
      break;
  }
});
