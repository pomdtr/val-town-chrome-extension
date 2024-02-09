export type ExtensionRequest = {
  type: "open";
  url: string;
  options?: {
    replace?: boolean;
  };
};
