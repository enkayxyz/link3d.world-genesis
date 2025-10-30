// background.js - Service worker for Google Contacts API integration

const GOOGLE_PEOPLE_API_BASE = 'https://people.googleapis.com/v1';
let authToken = null;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkContact') {
    checkContact(request.name, request.url)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'createContact') {
    createContact(request.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'updateContact') {
    updateContact(request.contactId, request.note)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Get OAuth token
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        authToken = token;
        resolve(token);
      }
    });
  });
}

// Check if contact exists
async function checkContact(name, url) {
  try {
    const token = await getAuthToken();
    
    // Search for contacts by name
    const searchUrl = `${GOOGLE_PEOPLE_API_BASE}/people:searchContacts?query=${encodeURIComponent(name)}&readMask=names,urls,biographies`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check if any result matches the LinkedIn URL
    if (data.results && data.results.length > 0) {
      for (const result of data.results) {
        const person = result.person;
        if (person.urls) {
          for (const urlObj of person.urls) {
            if (urlObj.value && urlObj.value.includes(url.split('?')[0])) {
              // Found matching contact
              return {
                success: true,
                exists: true,
                contactId: person.resourceName
              };
            }
          }
        }
      }
    }
    
    return { success: true, exists: false, contactId: null };
  } catch (error) {
    console.error('Error checking contact:', error);
    return { success: false, error: error.message };
  }
}

// Create new contact
async function createContact(data) {
  try {
    const token = await getAuthToken();
    
    // Prepare contact data
    const contactData = {
      names: [
        {
          givenName: data.name.split(' ')[0] || data.name,
          familyName: data.name.split(' ').slice(1).join(' ') || '',
          displayName: data.name
        }
      ],
      organizations: [
        {
          title: data.title,
          current: true
        }
      ],
      urls: [
        {
          value: data.url,
          type: 'profile'
        }
      ],
      biographies: [
        {
          value: data.memory,
          contentType: 'TEXT_PLAIN'
        }
      ]
    };
    
    const response = await fetch(`${GOOGLE_PEOPLE_API_BASE}/people:createContact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const result = await response.json();
    return { success: true, contactId: result.resourceName };
  } catch (error) {
    console.error('Error creating contact:', error);
    return { success: false, error: error.message };
  }
}

// Update existing contact
async function updateContact(contactId, newNote) {
  try {
    const token = await getAuthToken();
    
    // First, get the current contact data
    const getUrl = `${GOOGLE_PEOPLE_API_BASE}/${contactId}?personFields=names,organizations,urls,biographies`;
    
    const getResponse = await fetch(getUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`Failed to fetch contact: ${getResponse.status}`);
    }
    
    const contactData = await getResponse.json();
    
    // Append new note to existing biography
    const existingBio = contactData.biographies && contactData.biographies[0] 
      ? contactData.biographies[0].value 
      : '';
    
    const updatedBio = existingBio 
      ? `${existingBio}\n\n${newNote}`
      : newNote;
    
    // Update contact
    const updateData = {
      resourceName: contactId,
      etag: contactData.etag,
      biographies: [
        {
          value: updatedBio,
          contentType: 'TEXT_PLAIN'
        }
      ]
    };
    
    const updateUrl = `${GOOGLE_PEOPLE_API_BASE}/${contactId}:updateContact?updatePersonFields=biographies`;
    
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`Failed to update contact: ${updateResponse.status} - ${JSON.stringify(errorData)}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating contact:', error);
    return { success: false, error: error.message };
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Contact Sync extension installed');
});
