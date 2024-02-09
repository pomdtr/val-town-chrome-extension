export type Config = {
  token: string;
  root: string;
};

export type BrowserContext = {
  url?: string;
  params: Record<string, any>;
};

export type CommandRef = {
  title: string;
  val: string;
  patterns?: string[];
  icon?: string;
  params?: Record<string, any>;
};

export type List = {
  type: "list";
  placeholder?: string;
  items: ListItem[];
};

export type Page = List;

export type Action =
  | {
    type: "copy";
    text: string;
  }
  | {
    type: "open";
    url: string;
  }
  | {
    type: "push";
    page: Page;
  }
  | {
    type: "close";
  };

export type ListItem = {
  title: string;
  subtitle?: string;
  icon?: string;
  commands?: CommandRef[];
};
