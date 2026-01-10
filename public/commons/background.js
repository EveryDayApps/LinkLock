// Background script to open options page when extension icon is clicked

// Chrome Manifest V3
if (typeof chrome !== "undefined" && chrome.action) {
  chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
  });
}

// Firefox Manifest V2
if (typeof browser !== "undefined" && browser.browserAction) {
  browser.browserAction.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
  });
}
