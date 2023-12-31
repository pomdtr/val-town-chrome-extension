export type Config = {
  token?: string;
  contextMenus: MenuItem[];
};

export type MenuItem = {
  title: string;
  val?: string;
  children?: MenuItem[];
};

export const defaultConfig = {
  "contextMenus": [],
};
