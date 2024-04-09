chrome.action.onClicked.addListener(async () => {
  chrome.runtime.openOptionsPage();
});

async function fetchFn(url: string, init?: RequestInit) {
  const resp = await fetch(url, init);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }

  return await resp.json();
}

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  console.log(msg);
  fetchFn(msg.url, msg.init).then((res) => {
    console.log("res", res);
    sendResponse(res);
  });
  return true;
});
