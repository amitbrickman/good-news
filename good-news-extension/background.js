// Background script for Good News Extension
// Handles extension lifecycle and permissions

importScripts('config.js');

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Show welcome message
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon48.png',
            title: EXTENSION_NAME,
            message: `Extension installed successfully! Visit ${TARGET_WEBSITE} to start converting bad news to good news.`
        });
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getExtensionInfo') {
        sendResponse({
            name: EXTENSION_NAME,
            version: EXTENSION_VERSION,
            targetWebsite: TARGET_WEBSITE,
            apiUrl: MASTRA_API_URL
        });
    }

    // Return true to indicate we will send a response asynchronously
    return true;
});

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
        // Content script will be automatically injected based on manifest.json
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // Check if we're on the target website
    const targetWebsite = TARGET_WEBSITE;
    if (tab.url && tab.url.includes(targetWebsite)) {
        // Open popup programmatically
        chrome.action.openPopup();
    } else {
        // Show message that extension only works on target website
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (targetSite) => {
                alert(`This extension only works on ${targetSite}. Please navigate to that website to use the extension.`);
            },
            args: [targetWebsite]
        });
    }
}); 