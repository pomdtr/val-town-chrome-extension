export const manifest: chrome.runtime.ManifestV3 = {
  author: "Achille Lacoin",
  description: "Val Town Extension",
  name: "Val Town",
  version: "0.0.0",
  manifest_version: 3,
  action: {
    default_title: "Click to open Val Town",
    default_icon: {
      16: "icons/16.png",
      19: "icons/19.png",
      32: "icons/32.png",
      38: "icons/38.png",
    },
    default_popup: "src/popup.html",
  },
  background: {
    service_worker: "src/worker.ts",
  },
  commands: {
    _execute_action: {
      description: "Show Command Palette",
      suggested_key: {
        mac: "Command+Shift+P",
        default: "Ctrl+Shift+P",
      },
    },
  },
  permissions: [
    "storage",
    "activeTab",
  ],
  options_ui: {
    page: "src/options.html",
  },
  icons: {
    16: "icons/16.png",
    19: "icons/19.png",
    32: "icons/32.png",
    38: "icons/38.png",
    48: "icons/48.png",
    64: "icons/64.png",
    96: "icons/96.png",
    128: "icons/128.png",
    256: "icons/256.png",
    512: "icons/512.png",
  },
};
