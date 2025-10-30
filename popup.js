// popup.js - Handle popup UI and user interactions

let profileData = null;
let contactExists = false;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  try {
    showLoading(true);
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we're on a LinkedIn profile page
    if (!tab.url || !tab.url.includes('linkedin.com/in/')) {
      showStatus('Please navigate to a LinkedIn profile page.', 'error');
      showLoading(false);
      return;
    }
    
    // Request profile data from content script
    chrome.tabs.sendMessage(tab.id, { action: 'getProfileData' }, async (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Error: Could not connect to LinkedIn page. Please refresh the page.', 'error');
        showLoading(false);
        return;
      }
      
      if (response && response.success) {
        profileData = response.data;
        
        // Generate AI summary
        await generateAISummary();
        
        // Check if contact exists in Google Contacts
        await checkContactExists();
        
        // Display profile data
        displayProfile();
        showLoading(false);
      } else {
        showStatus('Error: Could not extract profile data. ' + (response?.error || ''), 'error');
        showLoading(false);
      }
    });
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
    showLoading(false);
  }
});

// Generate AI summary using chrome.ai
async function generateAISummary() {
  try {
    // Check for different Chrome AI API versions
    const aiAPI = chrome.ai || chrome.aiOriginTrial;
    
    if (!aiAPI || !aiAPI.languageModel) {
      console.warn('Chrome AI not available, using fallback summary');
      profileData.memory = `Professional summary: ${profileData.title}. ${profileData.about ? profileData.about.substring(0, 150) + '...' : 'No additional information available.'}`;
      return;
    }
    
    const session = await aiAPI.languageModel.create({
      systemPrompt: 'You are a helpful assistant that creates concise professional summaries. Summarize the following LinkedIn "About" section into a brief professional memory (2-3 sentences max).'
    });
    
    const aboutText = profileData.about || 'No about section available.';
    const prompt = `Summarize this LinkedIn profile "About" section into a professional memory:\n\n${aboutText}`;
    
    const summary = await session.prompt(prompt);
    profileData.memory = summary || aboutText.substring(0, 200) + '...';
    
    session.destroy();
  } catch (error) {
    console.error('Error generating AI summary:', error);
    // Fallback to truncated about section
    profileData.memory = profileData.about ? 
      profileData.about.substring(0, 200) + '...' : 
      'Professional connection from LinkedIn.';
  }
}

// Check if contact exists in Google Contacts
async function checkContactExists() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'checkContact',
      name: profileData.name,
      url: profileData.url
    });
    
    if (response && response.success) {
      contactExists = response.exists;
      profileData.existingContactId = response.contactId;
    } else {
      console.error('Error checking contact:', response?.error);
      contactExists = false;
    }
  } catch (error) {
    console.error('Error checking contact:', error);
    contactExists = false;
  }
}

// Display profile data in popup
function displayProfile() {
  document.getElementById('profileName').textContent = profileData.name || 'Unknown';
  document.getElementById('profileTitle').textContent = profileData.title || 'No title';
  document.getElementById('profileMemory').textContent = profileData.memory || 'No summary available';
  
  // Update button text based on contact existence
  const newBtn = document.getElementById('newContactBtn');
  const updateBtn = document.getElementById('updateContactBtn');
  
  if (contactExists) {
    newBtn.textContent = 'Contact Exists';
    newBtn.disabled = true;
    updateBtn.textContent = 'Update Contact';
    updateBtn.disabled = false;
  } else {
    newBtn.textContent = 'New Contact';
    newBtn.disabled = false;
    updateBtn.textContent = 'No Existing Contact';
    updateBtn.disabled = true;
  }
  
  document.getElementById('content').classList.remove('hidden');
}

// Create new contact
document.getElementById('newContactBtn').addEventListener('click', async () => {
  try {
    showLoading(true);
    
    const response = await chrome.runtime.sendMessage({
      action: 'createContact',
      data: {
        name: profileData.name,
        title: profileData.title,
        url: profileData.url,
        memory: profileData.memory
      }
    });
    
    showLoading(false);
    
    if (response && response.success) {
      showStatus('Contact created successfully!', 'success');
      contactExists = true;
      displayProfile();
    } else {
      showStatus('Error creating contact: ' + (response?.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    showLoading(false);
    showStatus('Error: ' + error.message, 'error');
  }
});

// Update existing contact
document.getElementById('updateContactBtn').addEventListener('click', async () => {
  try {
    showLoading(true);
    
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${profileData.memory}`;
    
    const response = await chrome.runtime.sendMessage({
      action: 'updateContact',
      contactId: profileData.existingContactId,
      note: newNote
    });
    
    showLoading(false);
    
    if (response && response.success) {
      showStatus('Contact updated successfully!', 'success');
    } else {
      showStatus('Error updating contact: ' + (response?.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    showLoading(false);
    showStatus('Error: ' + error.message, 'error');
  }
});

// Helper functions
function showLoading(show) {
  const loading = document.getElementById('loading');
  if (show) {
    loading.classList.remove('hidden');
  } else {
    loading.classList.add('hidden');
  }
}

function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.classList.remove('hidden');
  
  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      statusEl.classList.add('hidden');
    }, 3000);
  }
}
