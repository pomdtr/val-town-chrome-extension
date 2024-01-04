export type Config = {
  token?: string;
  actions: Action[];
};

export type Action = {
  title: string;
  config?: Record<string, any>;
  url?: string;
  children?: Action[];
};

export const defaultConfig: Config = {
  actions: [
    {
      title: "Copy Markdown Link",
      url: "https://esm.town/v/pomdtr/copy_markdown_link",
    },
  ],
};
