export type Config = {
  contextMenus: MenuItem[];
};

export type MenuItem = {
  title: string;
  val?: string;
  children?: MenuItem[];
  patterns?: string[];
};

export const defaultConfig = {
  "contextMenus": [],
};
