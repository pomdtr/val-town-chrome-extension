import React from "react";
import ReactDOM from "react-dom/client";
import CommandPalette from "./components/CommandPalette";

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
  <React.StrictMode>
    <CommandPalette />
  </React.StrictMode>
);
