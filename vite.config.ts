import { defineConfig } from "vite";
import webExtension from "@samrum/vite-plugin-web-extension";
import path from "path";
import { manifest } from "./src/manifest";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    build: {
      outDir: "extension",
    },
    plugins: [
      webExtension({
        manifest,
        additionalInputs: {
          html: ["src/sidepanel.html"],
        },
      }),
    ],
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./src"),
      },
    },
  };
});
