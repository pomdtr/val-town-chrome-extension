import { ExtensionRequest } from "./msg";

const handleMessage = async (msg: ExtensionRequest) => {
  switch (msg.type) {
    case "open-url":
      if (msg.options?.replace) {
        await chrome.tabs.update({ url: msg.url });
      } else {
        await chrome.tabs.create({ url: msg.url });
      }
      return;
    case "get-tab-url":
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tab = tabs[0];
      return tab.url;
  }
};

chrome.runtime.onConnect.addListener(async (port) => {
  console.log("popup connected to worker", port);

  port.onMessage.addListener(async (msg: ExtensionRequest) => {
    console.log("popup message", msg);
    const response = await handleMessage(msg);
    if (response) {
      console.log("worker response", response);
      port.postMessage(response);
    }
  });

  port.onDisconnect.addListener(() => {
    port.onMessage.removeListener(handleMessage);
  });
});
