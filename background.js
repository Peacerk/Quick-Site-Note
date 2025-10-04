// Website Notes Extension - Background Script (Service Worker)

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.sync.set({
      notesEnabled: true
    });
    
    console.log('Website Notes extension installed');
  } else if (details.reason === 'update') {
    console.log('Website Notes extension updated');
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup automatically since we have default_popup set in manifest
  // This handler is here for potential future functionality
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getNoteCount') {
    // Get note count for a specific URL
    chrome.storage.local.get([message.url]).then((result) => {
      const notes = result[message.url] || [];
      sendResponse({count: notes.length});
    });
    return true; // Indicates we will send a response asynchronously
  }
  
  if (message.type === 'getAllNotes') {
    // Get all notes across all websites (for potential future features)
    chrome.storage.local.get(null).then((allData) => {
      sendResponse({allNotes: allData});
    });
    return true;
  }
});

// Optional: Handle tab updates to refresh note display
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Page has finished loading, could send message to content script if needed
    // This is useful for Single Page Applications that change URL without page reload
  }
});

// Optional: Clean up old notes (run periodically)
// Note: Alarms require 'alarms' permission in manifest
// chrome.alarms.onAlarm.addListener((alarm) => {
//   if (alarm.name === 'cleanupOldNotes') {
//     cleanupOldNotes();
//   }
// });

// Set up periodic cleanup (optional feature)
// chrome.runtime.onStartup.addListener(() => {
//   chrome.alarms.create('cleanupOldNotes', {
//     delayInMinutes: 60, // Run after 1 hour
//     periodInMinutes: 24 * 60 // Then every 24 hours
//   });
// });

// Cleanup function (currently unused but available for future use)
async function cleanupOldNotes() {
  try {
    const allData = await chrome.storage.local.get(null);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep notes for 90 days
    
    for (const [url, notes] of Object.entries(allData)) {
      if (Array.isArray(notes)) {
        const filteredNotes = notes.filter(note => {
          if (note && note.timestamp) {
            const noteDate = new Date(note.timestamp);
            return noteDate > cutoffDate;
          }
          return true; // Keep notes without timestamp
        });
        
        if (filteredNotes.length !== notes.length) {
          if (filteredNotes.length > 0) {
            await chrome.storage.local.set({[url]: filteredNotes});
          } else {
            await chrome.storage.local.remove([url]);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}