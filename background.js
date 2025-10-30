// --- Global State ---
// This holds the data for the *current* active tab.
// This is a hackathon-level state solution.
let activeProfileData = null;

// --- Main Message Listener (from popup.js) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // We use a "return true" to indicate an async response
    if (request.action === 'processLinkedInProfile') {
        handleProcessProfile(sendResponse);
        return true; 
    } else if (request.action === 'requestAuth') {
        handleRequestAuth(sendResponse);
        return true;
    } else if (request.action === 'createContact') {
        handleCreateContact(sendResponse);
        return true;
    } else if (request.action === 'updateContact') {
        handleUpdateContact(sendResponse);
        return true;
    }
});

// --- Action 1: Process LinkedIn Profile (The "Main" function) ---
async function handleProcessProfile(sendResponse) {
    try {
        const token = await getAuthToken(false); // Check for token, don't request
        if (!token) {
            sendResponse({ status: 'needs_auth' });
            return;
        }
        
        // 1. Get current tab
        const tab = await getActiveTab();
        if (!tab || !tab.url.includes('linkedin.com/in/')) {
            sendResponse({ status: 'error', message: 'Not on a LinkedIn profile page.' });
            return;
        }

        // 2. Scrape the profile
        const scrapeResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content_script.js']
        });

        const profile = scrapeResults[0].result.data;
        if (scrapeResults[0].result.status === 'error') {
            sendResponse(scrapeResults[0].result); // Pass error message to popup
            return;
        }

        // 3. Run AI Summarization
        const aiMemory = await generateAiMemory(profile.about);

        // 4. Search Google Contacts
        const searchResult = await searchContact(profile.name, token);

        // 5. Store data in global state for popup actions
        activeProfileData = {
            profile: profile,
            aiMemory: aiMemory,
            contactExists: !!searchResult,
            contact: searchResult // Will be null or the contact object
        };

        // 6. Send all data to popup
        sendResponse({ status: 'success', data: activeProfileData });

    } catch (error) {
        console.error('Link3d Error:', error);
        sendResponse({ status: 'error', message: error.message });
    }
}

// --- Action 2: Handle Auth Request ---
async function handleRequestAuth(sendResponse) {
    try {
        const token = await getAuthToken(true); // Request auth screen
        if (token) {
            sendResponse({ status: 'success', token: token });
        } else {
            sendResponse({ status: 'error', message: 'Auth not granted.' });
        }
    } catch (error) {
        sendResponse({ status: 'error', message: error.message });
    }
}

// --- Action 3: Create Google Contact ---
async function handleCreateContact(sendResponse) {
    if (!activeProfileData) {
        sendResponse({ status: 'error', message: 'No profile data. Please reopen popup.' });
        return;
    }

    const { profile, aiMemory } = activeProfileData;
    const token = await getAuthToken(true);

    const contactBody = {
        names: [{ givenName: profile.name.split(' ')[0], familyName: profile.name.split(' ').slice(1).join(' ') }],
        organizations: [{ title: profile.title }],
        urls: [{ value: profile.profileUrl, type: 'profile' }],
        biographies: [{ value: `[${getTimestamp()}] ${aiMemory}\n\nSynced from Link3d.` }]
    };

    try {
        const response = await fetch('https://people.googleapis.com/v1/people:createContact', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactBody)
        });

        if (!response.ok) {
            throw new Error(`Google API Error: ${response.statusText}`);
        }
        
        const result = await response.json();
        activeProfileData.contact = result; // Store new contact
        activeProfileData.contactExists = true;
        sendResponse({ status: 'success', data: result });

    } catch (error) {
        sendResponse({ status: 'error', message: error.message });
    }
}

// --- Action 4: Update Google Contact ---
async function handleUpdateContact(sendResponse) {
    if (!activeProfileData || !activeProfileData.contact) {
        sendResponse({ status: 'error', message: 'Contact not found. Please reopen popup.' });
        return;
    }

    const { contact, aiMemory } = activeProfileData;
    const token = await getAuthToken(true);

    // Get existing notes/bio
    const existingBio = contact.biographies ? contact.biographies[0].value : '';
    const newBio = `${existingBio}\n\n[${getTimestamp()}] ${aiMemory}`;

    const contactBody = {
        // We need the ETag for an update
        etag: contact.etag,
        biographies: [{ value: newBio }]
    };

    try {
        const response = await fetch(`https://people.googleapis.com/v1/${contact.resourceName}:updateContact`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactBody),
            search: '?updatePersonFields=biographies' // Tell API what we are updating
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google API Error: ${response.statusText}. ${errorText}`);
        }
        
        const result = await response.json();
        activeProfileData.contact = result; // Update contact with new ETag
        sendResponse({ status: 'success', data: result });

    } catch (error) {
        sendResponse({ status: 'error', message: error.message });
    }
}


// --- Utility: Get Active Tab ---
async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
}

// --- Utility: Get Auth Token ---
function getAuthToken(interactive) {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: interactive }, (token) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(token);
            }
        });
    });
}

// --- Utility: Generate AI Memory ---
async function generateAiMemory(aboutText) {
    if (!chrome.ai) {
        throw new Error('chrome.ai API not available.');
    }
    const session = await chrome.ai.createTextSession();
    const prompt = `Summarize this professional bio in one or two sentences for a contact note, focusing on their current role and expertise: "${aboutText}"`;
    const result = await session.prompt(prompt);
    session.destroy();
    return result.trim();
}

// --- Utility: Search Contact ---
async function searchContact(name, token) {
    const url = `https://people.googleapis.com/v1/people:searchContacts?query=${encodeURIComponent(name)}&readMask=names,organizations,urls,biographies,etag`;
    
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error(`Google API Error: ${response.statusText}`);
    }

    const data = await response.json();
    // This is a simple match. A real app would let the user choose.
    if (data.results && data.results.length > 0) {
        return data.results[0].person; // Return the first match
    }
    return null; // No match found
}

// --- Utility: Get Timestamp ---
function getTimestamp() {
    return new Date().toLocaleDateString('en-US');
}
