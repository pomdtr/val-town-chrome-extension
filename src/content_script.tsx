import React from "react";
import ReactDOM from "react-dom/client";

import browser from "webextension-polyfill";
import App from "./components/App";

async function renderContent(
    cssPaths: string[],
    render: (appRoot: HTMLElement) => void
) {
    cssPaths.forEach((cssPath: string) => {
        const styleEl = document.createElement("link");
        styleEl.setAttribute("rel", "stylesheet");
        styleEl.setAttribute("href", browser.runtime.getURL(cssPath));
        document.head.appendChild(styleEl);
    });

    const container = document.createElement("div");
    container.id = "val-town-container";
    document.body.appendChild(container);

    render(container);
}


renderContent(import.meta.PLUGIN_WEB_EXT_CHUNK_CSS_PATHS, (appRoot) => {
    ReactDOM.createRoot(appRoot).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
});
