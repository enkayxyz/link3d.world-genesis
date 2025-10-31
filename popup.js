// Link3d (Hackathon) - Popup Script
// This script runs when the user clicks the extension icon.

// --- Utility Functions ---
function showState(state) {
  // Hide all states
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('auth-state').style.display = 'none';
  document.getElementById('new-contact-state').style.display = 'none';
  document.getElementById('contact-found-state').style.display = 'none';
  document.getElementById('success-state').style.display = 'none';
  document.getElementById('error-state').style.display = 'none';

  // Show the requested state
  const stateElement = document.getElementById(state);
  if (stateElement) {
    stateElement.style.display = 'block';
  }
}

function setStatusLight(color) {
  const light = document.getElementById('status-light');
  if (light) {
    light.style.backgroundColor = color;
  }
}

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
  // Set initial status to loading
  showState('loading-state');
  setStatusLight('#f59e0b'); // Yellow (loading)

  // Get the current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (!currentTab) {
      showState('error-state');
      document.getElementById('error-message').innerText = "Could not find active tab.";
      setStatusLight('#c5221f'); // Red (error)
      return;
    }
    
    if (!currentTab.url || !currentTab.url.includes("linkedin.com/in/")) {
       showState('error-state');
       document.getElementById('error-message').innerText = "Not a LinkedIn profile page.";
       setStatusLight('#c5221f'); // Red (error)
       return;
    }

    // --- Send the INITAL message to the background script to start ---
    chrome.runtime.sendMessage({ 
      action: "processProfile",
      tabId: currentTab.id 
    });
  });

  // --- Event Listeners for Buttons ---
  
  // Authorize button
  document.getElementById('auth-button').addEventListener('click', () => {
    showState('loading-state');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      // Send message to background to start interactive auth
      chrome.runtime.sendMessage({ 
        action: "doAuth",
        tabId: tabs[0].id
      });
    });
  });

  // Create Contact button
  document.getElementById('create-button').addEventListener('click', () => {
    showState('loading-state');
    chrome.runtime.sendMessage({ action: "createContact" });
  });

  // Update Contact button
  document.getElementById('update-button').addEventListener('click', () => {
    showState('loading-state');
    chrome.runtime.sendMessage({ action: "updateContact" });
  });

});

// --- Listener for ALL messages from the background script ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    
    case "authRequired":
      showState('auth-state');
      setStatusLight('#f59e0b'); // Yellow (needs action)
      break;
    
    case "showNewContact":
      document.getElementById('new-name').innerText = message.data.name;
      document.getElementById('new-title').innerText = message.data.title;
      document.getElementById('new-ai-summary').innerText = message.data.aiSummary;
      showState('new-contact-state');
      setStatusLight('#1a73e8'); // Blue (ready)
      break;

    case "showContactFound":
      document.getElementById('found-name').innerText = message.data.name;
      document.getElementById('found-title').innerText = message.data.title;
      document.getElementById('found-ai-summary').innerText = message.data.aiSummary;
      showState('contact-found-state');
      setStatusLight('#1e8e3e'); // Green (found)
      break;

    case "showSuccess":
      document.getElementById('success-message').innerText = message.message;
      showState('success-state');
      setStatusLight('#1e8e3e'); // Green (success)
      // Close popup after 2 seconds
      setTimeout(() => window.close(), 2000);
      break;

    case "showError":
      document.getElementById('error-message').innerText = message.error;
      showState('error-state');
      setStatusLight('#c5221f'); // Red (error)
      break;
  }
});

