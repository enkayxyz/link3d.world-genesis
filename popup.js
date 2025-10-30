// --- DOM Elements ---
const loadingState = document.getElementById('loading-state');
const authState = document.getElementById('auth-state');
const newContactState = document.getElementById('new-contact-state');
const existingContactState = document.getElementById('existing-contact-state');
const successState = document.getElementById('success-state');
const errorState = document.getElementById('error-state');

// Buttons
const authButton = document.getElementById('auth-button');
const createContactButton = document.getElementById('create-contact-button');
const updateContactButton = document.getElementById('update-contact-button');

// --- Helper: Show/Hide UI States ---
function showState(state) {
    [loadingState, authState, newContactState, existingContactState, successState, errorState].forEach(el => {
        el.classList.add('hidden');
    });
    document.getElementById(state).classList.remove('hidden');
}

// --- Main Function: Initialize Popup ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Send message to background script to start the process
    chrome.runtime.sendMessage({ action: 'processLinkedInProfile' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            handleError('Failed to connect to background. Please reload the extension.');
            return;
        }

        if (response.status === 'error') {
            handleError(response.message);
        } else if (response.status === 'needs_auth') {
            showState('auth-state');
        } else if (response.status === 'success') {
            displayData(response.data);
        }
    });
});

// --- Event Listeners ---
authButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'requestAuth' }, (response) => {
        if (response.status === 'success') {
            // Re-run the initial process after successful auth
            showState('loading-state');
            chrome.runtime.sendMessage({ action: 'processLinkedInProfile' }, (response) => {
                if (response.status === 'success') {
                    displayData(response.data);
                } else {
                    handleError(response.message || 'Error after auth.');
                }
            });
        } else {
            handleError(response.message || 'Authorization failed.');
        }
    });
});

createContactButton.addEventListener('click', () => {
    showState('loading-state');
    chrome.runtime.sendMessage({ action: 'createContact' }, (response) => {
        if (response.status === 'success') {
            showSuccess('Contact created successfully!');
        } else {
            handleError(response.message || 'Failed to create contact.');
        }
    });
});

updateContactButton.addEventListener('click', () => {
    showState('loading-state');
    chrome.runtime.sendMessage({ action: 'updateContact' }, (response) => {
        if (response.status === 'success') {
            showSuccess('Memory added successfully!');
        } else {
            handleError(response.message || 'Failed to update contact.');
        }
    });
});

// --- UI Display Functions ---

function displayData(data) {
    if (data.contactExists) {
        // State B: Existing Contact
        document.getElementById('existing-name').textContent = data.contact.name;
        document.getElementById('existing-memory').textContent = data.aiMemory;
        showState('existing-contact-state');
    } else {
        // State A: New Contact
        document.getElementById('new-name').textContent = data.profile.name;
        document.getElementById('new-title').textContent = data.profile.title;
        document.getElementById('new-memory').textContent = data.aiMemory;
        showState('new-contact-state');
    }
}

function handleError(message) {
    document.getElementById('error-message').textContent = message;
    showState('error-state');
}

function showSuccess(message) {
    document.getElementById('success-message').textContent = message;
    showState('success-state');
}
