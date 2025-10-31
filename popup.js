// Link3d (Hackathon) - Popup Script

function showState(stateId) {
  document.querySelectorAll('.state').forEach(state => {
    state.classList.remove('active');
  });
  const state = document.getElementById(stateId);
  if (state) state.classList.add('active');
}

function setStatusLight(color) {
  const light = document.getElementById('status-light');
  if (light) light.style.backgroundColor = color;
}

function updateProgress(stepId, status) {
  const step = document.getElementById(`step-${stepId}`);
  if (!step) return;
  const icon = step.querySelector('.step-icon');
  if (!icon) return;
  icon.classList.remove('pending', 'active', 'success', 'failed');
  icon.classList.add(status);
}

document.addEventListener('DOMContentLoaded', () => {
  // Reset all step icons to pending on load
  document.querySelectorAll('.step-icon').forEach(icon => {
    icon.classList.remove('active', 'success', 'failed');
    icon.classList.add('pending');
  });
  
  showState('loading-state');
  setStatusLight('#f59e0b');

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (!currentTab) {
      showState('error-state');
      document.getElementById('error-message').innerText = "Could not find active tab.";
      setStatusLight('#dc2626');
      return;
    }
    
    if (!currentTab.url || !currentTab.url.includes("linkedin.com/in/")) {
       showState('error-state');
       document.getElementById('error-message').innerText = "Not a LinkedIn profile page.";
       setStatusLight('#dc2626');
       return;
    }

    chrome.runtime.sendMessage({ action: "processProfile", tabId: currentTab.id });
  });

  const authButton = document.getElementById('auth-button');
  if (authButton) {
    authButton.addEventListener('click', () => {
      showState('loading-state');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.runtime.sendMessage({ action: "doAuth", tabId: tabs[0].id });
      });
    });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  console.log('[Popup] Message:', message);
  
  switch (message.action) {
    case "progress":
      updateProgress(message.step, message.status);
      break;
    
    case "authRequired":
      showState('auth-state');
      setStatusLight('#f59e0b');
      break;
    
    case "showNewContact":
    case "showContactFound":
      document.getElementById('result-name').innerText = message.data.name;
      document.getElementById('result-title').innerText = message.data.title;
      document.getElementById('result-ai-summary').innerText = message.data.aiSummary;
      showState('result-state');
      setStatusLight('#3b82f6');
      
      setTimeout(() => {
        updateProgress('g', 'active');
        const action = message.action === "showNewContact" ? "createContact" : "updateContact";
        chrome.runtime.sendMessage({ action });
      }, 500);
      break;

    case "showSuccess":
      const syncStatus = document.getElementById('sync-status');
      if (syncStatus) {
        syncStatus.style.display = 'block';
        syncStatus.innerText = `✓ ${message.message}`;
      }
      updateProgress('g', 'success');
      setStatusLight('#16a34a');
      setTimeout(() => window.close(), 3000);
      break;
  }
});
