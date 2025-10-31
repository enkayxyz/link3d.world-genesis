/**
 * Link3d-Memory (AI Hackathon)
 *
 * l3_analyzer_agent.js (v22 - "Typo Fix")
 *
 * This is the main "brain" agent (service worker).
 * It imports the `l3_extractor` as a tool.
 *
 * v22 FIX: Corrected a fatal typo in the PEOPLE_API_SCOPE constant.
 */

// v21: Import our specialist "robot" agent!
import { extractProfileData } from './l3_extractor.js';
import { geminiApiKey } from './config.js';

// --- Mutable State ---
// Holds the latest contact package so popup actions (create/update) can reuse it.
let latestContactPackage = null;

// --- Constants ---
// v22 FIX: Removed the "g" typo from "httpsg"
const PEOPLE_API_SCOPE = "https://www.googleapis.com/auth/contacts"; 
const PEOPLE_API_URL = "https://people.googleapis.com/v1/people";

// --- Gemini Fallback Constants ---
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_MODEL = "gemini-2.0-flash"; // Latest model

// --- AI Prompts ---
const GEMINI_EXTRACT_PROMPT_PREFIX = `
You are an expert, silent data extractor. From the following raw text dump of a LinkedIn profile, extract:
1. The person's full name (e.g., "Nirav Shah").
2. Their current, primary job title (e.g., "Founder at Kosha").
3. The "About" section bio.

CRITICAL: Return ONLY a valid JSON object. Do NOT include any preamble, markdown, or other text.
Your entire response must be ONLY the JSON object.

Format:
{
  "name": "...",
  "title": "...",
  "about": "..."
}

If you cannot find a field, return null for its value.

Text Dump:
"""
`;

const GEMINI_SUMMARY_PROMPT_PREFIX = "You are a contact management assistant. Summarize this professional bio in one compelling sentence for a 'contact note'. Do not use markdown or quotes. Just return the single sentence.\n\nBio:\n\"";
const GEMINI_PROMPT_SUFFIX = "\"\n\nSummary:";


// --- 1. Main Message Listener (From Popup) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log("Analyzer(v22): Received message from popup:", request);
  if (request.action === "processProfile") {
    // This is the main trigger from the popup
    if (sender.tab && sender.tab.id) {
       handleProcessProfile(sender.tab.id);
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          handleProcessProfile(tabs[0].id);
        } else {
          log("Analyzer(v22) CRITICAL: Could not get active tab ID.");
          sendMessageToPopup({ action: "showError", error: "Could not find active tab." });
        }
      });
    }
    if (typeof sendResponse === "function") {
      sendResponse({ started: true });
    }
    return true;
  } else if (request.action === "doAuth" || request.action === "getAuthToken") {
    const targetTabId = request.tabId;
    getAuthToken(true)
      .then(() => {
        log("Analyzer(v22): Interactive auth succeeded.");
        if (typeof targetTabId === "number") {
          handleProcessProfile(targetTabId);
        } else {
          sendMessageToPopup({ action: "showSuccess", message: "Authorization complete. Click Scan again." });
        }
      })
      .catch((error) => {
        log("Analyzer(v22): Interactive auth failed:", error);
        sendMessageToPopup({ action: "showError", error: `Authorization failed: ${error.message}` });
      });
    if (typeof sendResponse === "function") {
      sendResponse({ started: true });
    }
    return true;
  }
  return false;
});

/**
 * The main function that runs the entire flow. (v22)
 */
async function handleProcessProfile(tabId) {
  log("--- Analyzer(v22): Starting Profile Process ---");
  latestContactPackage = null; // Clear any stale data from prior runs
  let token;

  // 1. Get Auth Token (Silently)
  try {
    token = await getAuthToken(false); // `interactive: false`
    log("Analyzer(v22): Auth token retrieved successfully.");
  } catch (error) {
    log("Analyzer(v22): Auth token failed (silent). Sending 'authRequired' to popup.", error);
    sendMessageToPopup({ action: "authRequired" });
    return;
  }

  // 2. Scrape Profile (v22: Call the extractor agent!)
  let scrapeResult;
  try {
    // We pass our `log` function to the extractor so it can report back
    scrapeResult = await extractProfileData(tabId, log); 
    if (!scrapeResult || !scrapeResult.allText) {
      throw new Error(`Extractor Agent failed. (v22)`);
    }
    log(`Analyzer(v22): Extractor scraped ${scrapeResult.allText.length} characters.`);
  } catch (error) {
    log("Analyzer(v22) CRITICAL ERROR in handleProcessProfile (Scrape):", error);
    sendMessageToPopup({ action: "showError", error: `Scrape Error: ${error.message}` });
    return;
  }

  // 3. Call AI (Smart Brain - Part 1: Extractor)
  let extractedData;
  try {
    extractedData = await callGeminiExtractor(scrapeResult.allText); 
    if (!extractedData || !extractedData.name || !extractedData.title) {
      throw new Error("AI Extractor failed to find Name or Title in text.");
    }
    log("Analyzer(v22): AI Extractor found data:", extractedData);
  } catch (error) {
    log("Analyzer(v22) CRITICAL ERROR in handleProcessProfile (AI Extract):", error);
    sendMessageToPopup({ action: "showError", error: `AI Extract Error: ${error.message}` });
    return;
  }
  
  // 4. Call AI (Smart Brain - Part 2: Summarizer)
  let aiSummary = "No 'About' section found to summarize.";
  if (extractedData.about) {
    try {
      aiSummary = await callGeminiSummarizer(extractedData.about);
      log("Analyzer(v22): AI Summary generated:", aiSummary);
    } catch (error) { 
      log("Analyzer(v22): AI Summary FAILED (non-critical):", error);
      aiSummary = "AI Summary failed to generate."; // Non-critical, we can proceed
    } 
  } else {
    log("Analyzer(v22): Skipping AI Summary, no 'About' section found.");
  }
  
  // 5. Package up the data (v22)
  const profileData = {
      name: extractedData.name,
      title: extractedData.title,
      about: extractedData.about,
      profileUrl: scrapeResult.profileUrl 
  };

  // 6. Search Google Contacts (v22: Search by URL)
  try {
    const searchResult = await searchContact(token, profileData.profileUrl, profileData.name);
    
    // Store the package so create/update can use it later.
    latestContactPackage = {
      profile: profileData,
      aiSummary: aiSummary,
      token: token,
      existingContact: searchResult // This will be the contact object or null
    };

    if (searchResult) {
      log("Analyzer(v22): Contact FOUND:", searchResult.resourceName);
      sendMessageToPopup({
        action: "showContactFound",
        data: {
          name: profileData.name,
          title: profileData.title,
          aiSummary: aiSummary
        }
      });
    } else {
      log("Analyzer(v22): Contact NOT found. Sending 'newContact' to popup.");
      sendMessageToPopup({
        action: "showNewContact",
        data: {
          name: profileData.name,
          title: profileData.title,
          aiSummary: aiSummary
        }
      });
    }

  } catch (error) {
    log("Analyzer(v22) CRITICAL ERROR in handleProcessProfile (Search/API):", error);
    sendMessageToPopup({ action: "showError", error: `Google API Error: ${error.message}` });
  }
}

// --- 2. Authentication Module ---

/**
 * Gets the Google OAuth token.
 * @param {boolean} interactive - If true, will force the auth popup.
 */
function getAuthToken(interactive) {
  log(`Analyzer(v22): Getting auth token (interactive: ${interactive})...`);
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: interactive, scopes: [PEOPLE_API_SCOPE] }, (token) => {
      if (chrome.runtime.lastError) {
        log("Analyzer(v22): getAuthToken ERROR:", chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        log("Analyzer(v22): getAuthToken SUCCESS.");
        resolve(token);
      }
    });
  });
}

// --- 4. AI Module --- (Scraper is now in l3_extractor.js)

/**
 * Calls the built-in Gemini Nano model (v22 Extractor) or OpenAI fallback
 * @param {string} rawText - The main column text dump from the page.
 */
async function callGeminiExtractor(rawText) {
  log("Analyzer(v22): Attempting AI extraction...");
  
  // Try chrome.ai first
  if (chrome.ai) {
    try {
      const aiStatus = await chrome.ai.canCreateTextSession();
      if (aiStatus === "readily") {
        log("Analyzer(v22): Using chrome.ai for extraction...");
        const session = await chrome.ai.createTextSession();
        const prompt = `${GEMINI_EXTRACT_PROMPT_PREFIX}${rawText}\n"""`;
        const aiResponse = await session.prompt(prompt);
        session.destroy();
        
        // v22 (from v20): Implement a "smarter" JSON parser.
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON object found in AI response.");
        const jsonString = jsonMatch[0];
        return JSON.parse(jsonString);
      }
    } catch (e) {
      log("Analyzer(v22): chrome.ai extraction failed, falling back to OpenAI:", e.message);
    }
  }
  
  // Fallback to Gemini with retry
  log("Analyzer(v22): Using Gemini fallback for extraction...");
  const apiKey = await getGeminiApiKey();
  if (!apiKey) throw new Error("No Gemini API key available.");
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${GEMINI_EXTRACT_PROMPT_PREFIX}${rawText}\n"""` }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });
      
      if (response.status === 429) {
        log(`Analyzer(v22): Rate limited (429), attempt ${attempt}/3. Waiting...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
        continue;
      }
      
      if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
      const data = await response.json();
      const jsonString = data.candidates[0].content.parts[0].text.trim();
      return JSON.parse(jsonString);
    } catch (e) {
      if (attempt === 3) throw e;
      log(`Analyzer(v22): Attempt ${attempt} failed: ${e.message}`);
    }
  }
}

/**
 * Calls the built-in Gemini Nano model (v22 Summarizer) or OpenAI fallback
 * @param {string} aboutText - The profile bio to summarize.
 */
async function callGeminiSummarizer(aboutText) {
  log("Analyzer(v22): Attempting AI summarization...");
  
  // Try chrome.ai first
  if (chrome.ai) {
    try {
      const aiStatus = await chrome.ai.canCreateTextSession();
      if (aiStatus === "readily") {
        log("Analyzer(v22): Using chrome.ai for summarization...");
        const session = await chrome.ai.createTextSession();
        const prompt = `${GEMINI_SUMMARY_PROMPT_PREFIX}${aboutText}${GEMINI_PROMPT_SUFFIX}`;
        const aiResponse = await session.prompt(prompt);
        session.destroy();
        
        return aiResponse.replace(/["*]/g, "").trim();
      }
    } catch (e) {
      log("Analyzer(v22): chrome.ai summarization failed, falling back to OpenAI:", e.message);
    }
  }
  
  // Fallback to Gemini with retry
  log("Analyzer(v22): Using Gemini fallback for summarization...");
  const apiKey = await getGeminiApiKey();
  if (!apiKey) throw new Error("No Gemini API key available.");
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${GEMINI_SUMMARY_PROMPT_PREFIX}${aboutText}${GEMINI_PROMPT_SUFFIX}` }] }],
        }),
      });
      
      if (response.status === 429) {
        log(`Analyzer(v22): Rate limited (429), attempt ${attempt}/3. Waiting...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
        continue;
      }
      
      if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();
    } catch (e) {
      if (attempt === 3) throw e;
      log(`Analyzer(v22): Attempt ${attempt} failed: ${e.message}`);
    }
  }
}


// --- Gemini Helper ---
async function getGeminiApiKey() {
  // Key loaded from config.js (gitignored)
  return geminiApiKey;
}


// --- 5. Google People API Module ---

/**
 * Searches for a contact by URL (v22) or Name (fallback)
 * @param {string} token - OAuth token.
 * @param {string} profileUrl - The URL of the LinkedIn profile.
 * @param {string} name - The name of the person (for fallback).
 */
async function searchContact(token, profileUrl, name) {
  log("Analyzer(v22): Searching for contact by URL:", profileUrl);
  let url = `${PEOPLE_API_URL}:searchContacts?query=${encodeURIComponent(profileUrl)}&readMask=names,notes,etag,urls`;
  let response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Google API Error: ${response.statusText}`);
  }

  let data = await response.json();
  
  if (data.results && data.results.length > 0) {
    for (const result of data.results) {
        const person = result.person;
        if (person.urls) {
            for (const urlEntry of person.urls) {
                if (urlEntry.value && urlEntry.value.includes(profileUrl)) {
                    log("Analyzer(v22): Contact search exact match FOUND by URL.");
                    return person; 
                }
            }
        }
    }
  }

  log("Analyzer(v22): No match by URL. Falling back to search by Name:", name);
  url = `${PEOPLE_API_URL}:searchContacts?query=${encodeURIComponent(name)}&readMask=names,notes,etag,urls`;
  response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Google API Error: ${response.statusText}`);
  }
  
  data = await response.json();
  if (data.results && data.results.length > 0) {
    const topResult = data.results[0].person;
    const displayName = topResult.names?.[0]?.displayName;
    if (displayName && displayName.toLowerCase() === name.toLowerCase()) {
      log("Analyzer(v22): Contact search exact match FOUND by Name.");
      return topResult;
    }
  }
  
  log("Analyzer(v22): No exact match found by URL or Name.");
  return null;
}

/**
 * Creates a new Google Contact.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "createContact") {
    log("Analyzer(v22): Received 'createContact' request.");

    if (!latestContactPackage) {
      log("Analyzer(v22): No contact package available for create.");
      sendMessageToPopup({ action: "showError", error: "No contact data available. Please scan again." });
      return true;
    }

    const { token, profile, aiSummary } = latestContactPackage;
    const note = `[AI Memory @ ${new Date().toISOString()}]:\n${aiSummary}\n\nProfile: ${profile.profileUrl}`;

    const nameParts = profile.name.split(' ');
    const givenName = nameParts[0];
    const familyName = nameParts.slice(1).join(' ');

    const newContact = {
      names: [{ givenName: givenName, familyName: familyName }],
      organizations: [{ title: profile.title }],
      urls: [{ value: profile.profileUrl, type: "profile" }], 
      notes: [{ value: note }]
    };

    fetch(`${PEOPLE_API_URL}:createContact`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(newContact)
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) { throw new Error(data.error.message); }
      log("Analyzer(v22): Contact CREATED successfully.");
      latestContactPackage = {
        ...latestContactPackage,
        existingContact: data
      };
      sendMessageToPopup({ action: "showSuccess", message: "Contact created!" });
    })
    .catch(error => {
      log("Analyzer(v22): Contact CREATION FAILED:", error);
      sendMessageToPopup({ action: "showError", error: `Create failed: ${error.message}` });
    });
    
    return true; // Async
  }
});

/**
 * Updates an existing Google Contact.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateContact") {
    log("Analyzer(v22): Received 'updateContact' request.");

    if (!latestContactPackage || !latestContactPackage.existingContact) {
      log("Analyzer(v22): No existing contact data available for update.");
      sendMessageToPopup({ action: "showError", error: "No existing contact data. Please rescan." });
      return true;
    }

    const { token, existingContact, aiSummary, profile } = latestContactPackage;
    
    const newNote = `[AI Memory @ ${new Date().toISOString()}]:\n${aiSummary}\n\nProfile: ${profile.profileUrl}`;
    const existingNotes = existingContact.notes?.[0]?.value || "";
    const updatedNotes = `${newNote}\n\n---\n\n${existingNotes}`;

    const existingUrls = existingContact.urls || [];
    const hasProfileUrl = existingUrls.some(url => url.value === profile.profileUrl);
    
    const contactToUpdate = {
      etag: existingContact.etag,
      notes: [{ value: updatedNotes }],
      urls: hasProfileUrl ? existingUrls : [...existingUrls, { value: profile.profileUrl, type: "profile" }]
    };
    
    const updateMask = hasProfileUrl ? "notes" : "notes,urls";
    const url = `${PEOPLE_API_URL}/${existingContact.resourceName}:updateContact?updateMask=${updateMask}`;

    fetch(url, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(contactToUpdate)
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) { throw new Error(data.error.message); }
      log("Analyzer(v22): Contact UPDATED successfully.");
      latestContactPackage = {
        ...latestContactPackage,
        existingContact: data
      };
      sendMessageToPopup({ action: "showSuccess", message: "Contact updated!" });
    })
    .catch(error => {
      log("Analyzer(v22): Contact UPDATE FAILED:", error);
      sendMessageToPopup({ action: "showError", error: `Update failed: ${error.message}` });
    });

    return true; // Async
  }
});


// --- 6. Utility Functions ---

/**
 * Sends a standardized message to the popup.
 * @param {object} message - Should include an `action` key that matches popup.js expectations.
 */
function sendMessageToPopup(message) {
  log("Analyzer(v22): Sending message to popup:", message);
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      log("Analyzer(v22): Error sending message to popup:", chrome.runtime.lastError.message);
    }
  });
}

/**
 * Helper for logging.
 */
function log(...args) {
  console.log("Link3d (Agent):", ...args);
}

// Initial log
log("Service worker (v22 - Typo Fix) started.");

