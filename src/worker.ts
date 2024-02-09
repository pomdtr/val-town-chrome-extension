import { ExtensionRequest } from "./msg";

chrome.runtime.onConnect.addListener(async (port) => {
  console.log("popup connected to worker", port);

  const listener = async (msg: ExtensionRequest) => {
    console.log("popup -> worker", msg);
    switch (msg.type) {
      case "open-url":
        if (msg.options?.replace) {
          await chrome.tabs.update({ url: msg.url });
        } else {
          await chrome.tabs.create({ url: msg.url });
        }
        return;
      case "get-url":
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const tab = tabs[0];
        return { type: "get-url", url: tab.url };
    }
  };

  port.onMessage.addListener(async (msg: ExtensionRequest) => {
    const response = await listener(msg);
    if (response) {
      port.postMessage(response);
    }
  });

  port.onDisconnect.addListener(() => {
    port.onMessage.removeListener(listener);
  });
});
