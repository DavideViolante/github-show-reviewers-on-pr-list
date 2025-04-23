// Add a settings page to configure and save the GitHub token
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ GITHUB_TOKEN: '' }, () => {
    console.log("GitHub token initialized to an empty string.");
  });
});

// Add a popup menu to open the settings page
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_GITHUB_TOKEN') {
    chrome.storage.sync.set({ GITHUB_TOKEN: message.token }, () => {
      console.log("GitHub token saved.");
      sendResponse({ success: true });
    });
    return true; // Keep the message channel open for async response
  }
});

