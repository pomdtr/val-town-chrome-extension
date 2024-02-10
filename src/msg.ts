export type ExtensionRequest = {
  type: "open-url";
  url: string;
  options?: {
    replace?: boolean;
  };
} | {
  type: "get-tab-url";
  url: string;
};
