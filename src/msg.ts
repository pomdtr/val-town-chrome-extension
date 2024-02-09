export type ExtensionRequest = {
  type: "open-url";
  url: string;
  options?: {
    replace?: boolean;
  };
} | {
  type: "get-url";
  url: string;
};
