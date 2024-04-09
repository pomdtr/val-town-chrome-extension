import "./enable-dev-hmr";
import ReactDOM from "react-dom/client";
import React, { useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import { loadConfig } from "./config";

type Tree = Node[];

type Node = {
  title: string;
  children?: Node[] | string;
  expanded?: boolean;
  actions?: Action[];
};

type Action =
  | {
      type: "open";
      icon?: string;
      url: string;
    }
  | {
      type: "copy";
      icon?: string;
      text: string;
    };

function extractVal(url: string) {
  const pattern = /https:\/\/www\.val\.town\/v\/(.[^\/]+)\/(.[^\/]+)/;
  const match = url.match(pattern);
  if (!match) {
    return null;
  }

  return {
    author: match[1],
    name: match[2],
  };
}

async function fetcher<T = any>(url: string, init?: RequestInit): Promise<T> {
  const config = await loadConfig();
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(init?.headers || {})) {
    headers[key] = value;
  }
  headers["Authorization"] = `Bearer ${config.token}`;

  const val = extractVal(window.location.href);
  if (val) {
    headers["X-Val-Slug"] = `${val.author}/${val.name}`;
  }

  console.log("fetching", config);
  const [author, name] = config.rootVal.split("/");
  const rootUrl = `https://${author}-${name}.web.val.run`;
  url = new URL(url, rootUrl).toString();
  const res = await chrome.runtime.sendMessage({
    type: "fetch",
    url: url,
    init: {
      ...init,
      headers,
    },
  });

  console.log(res);
  return res;
}

export function Sidebar(props: { onClose?: () => void }) {
  const { data: tree } = useSWR("/", fetcher<Tree>);
  const { mutate } = useSWRConfig();

  return (
    <div className="text-sm flex flex-col">
      <div className="flex items-center justify-end gap-x-2">
        <button
          className="text-xl"
          onClick={() => {
            mutate("/");
          }}
        >
          ↺
        </button>
        <button className="text-xl" onClick={props.onClose}>
          ×
        </button>
      </div>
      <ul>
        {tree?.map((node) => (
          <li key={node.title}>
            <Tree root={node} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Tree({ root }: { root: Node }) {
  const [children, setChildren] = React.useState<Node[]>();
  const [open, setOpen] = React.useState(root.expanded);

  useEffect(() => {
    if (!open || !root.children) {
      return;
    }

    if (Array.isArray(root.children)) {
      setChildren(root.children);
      return;
    }

    fetcher<Tree>(root.children).then(setChildren);
  }, [open]);

  if (!root.children) {
    return (
      <p
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="text-ellipsis"
      >
        <Item title={root.title} actions={root.actions} />
      </p>
    );
  }

  return (
    <details
      open={open}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(!open);
      }}
    >
      <summary className="hover:cursor-pointer truncate text-ellipsis">
        <Item title={root.title} actions={root.actions} />
      </summary>
      <ul>
        {children?.map((child) => (
          <li className="ml-2" key={child.title}>
            <Tree root={child} />
          </li>
        ))}
      </ul>
    </details>
  );
}

function Item(props: { title: string; actions?: Action[] }) {
  return (
    <>
      {props.title}{" "}
      {props.actions?.map((action, idx) => (
        <Action key={idx} action={action} />
      ))}
    </>
  );
}

function Action({ action }: { action: Action }) {
  return (
    <>
      <a
        href={action.type === "open" ? action.url : undefined}
        className={"hover:cursor-pointer"}
        onClick={(e) => {
          e.stopPropagation();
          if (action.type === "copy") {
            navigator.clipboard.writeText(action.text);
          }
        }}
      >
        {action.icon || "▶️"}
      </a>{" "}
    </>
  );
}
document.body.classList.add("flex");

document.addEventListener("keydown", (e) => {
  if (e.key === "b" && e.metaKey) {
    e.preventDefault();
  }
});

const toggleButton = document.createElement("button");
toggleButton.classList.add(
  "bg-white",
  "text-gray-700",
  "border-gray-200",
  "fixed",
  "h-10",
  "w-10",
  "rounded-full",
  "border",
  "shadow-md",
  "hover:text-black",
  "hover:border-gray-300",
  "aria-expanded:text-black",
  "aria-expanded:bg-gray-100",
  "aria-expanded:border-gray-300",
  "hover:shadow-lg"
);
toggleButton.textContent = "☰";
toggleButton.style.bottom = "1.25rem";
toggleButton.style.left = "1.25rem";
// toggle button is on the left, vertically centered

toggleButton.addEventListener("click", () => {
  aside.style.display = "block";
  toggleButton.style.display = "none";
});

const aside = document.createElement("aside");
aside.classList.add(
  "h-screen",
  "top-0",
  "bg-white",
  "p-2",
  "shadow",
  "w-80",
  "overflow-auto"
);

aside.style.borderRightWidth = "1px";
aside.style.position = "sticky";
aside.style.display = "none";

const main = document.body.firstChild as HTMLDivElement;
document.body.insertBefore(aside, main);
document.body.appendChild(toggleButton);

const root = ReactDOM.createRoot(aside);
root.render(
  <Sidebar
    onClose={() => {
      aside.style.display = "none";
      toggleButton.style.display = "block";
    }}
  />
);
