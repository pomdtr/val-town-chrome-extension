export async function loadConfig(): Promise<Config> {
  const storage = await chrome.storage.local.get(["config"]);
  return JSON.parse(storage.config || `{ "rootVal": "pomdtr/tree_example" }`);
}
export type Config = {
  token: string;
  rootVal: string;
};
