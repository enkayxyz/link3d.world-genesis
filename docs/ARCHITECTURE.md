Link3d-Memory: Hackathon Architecture

This document outlines the high-level architecture for our "v2 - AI-Memory" Chrome extension for the Google AI Hackathon.

1. High-Level Goal

To create a Chrome extension that, with one click on a LinkedIn profile:

Authenticates with Google Contacts.

Scrapes the profile's Name, Title, and "About" summary.

Uses built-in AI (chrome.ai) to summarize the "About" text into a "memory."

Checks Google Contacts to see if the person exists.

Presents a UI to either "Create New Contact" or "Add Memory to Contact."

2. Component Breakdown

The extension consists of five key files that work as a system:

manifest.json (The "Blueprint")

Role: Defines the extension's rules, permissions, and parts.

Key Permissions: identity (for Google auth), scripting (to run the scraper), activeTab (to know what page we're on), and ai (to use Gemini Nano).

Crucial Part: Contains the oauth2.client_id and the content_security_policy (which we debugged) to allow our scripts to run.

popup.html (The "Storefront")

Role: The only thing the user sees. It's a "dumb" file that just contains all the possible UI states (Loading, Auth, New, Update, Error, Success).

Key Feature: Uses inline CSS (<style>...) to comply with the Content Security Policy (CSP). It must not link to any external files (like Tailwind CDN).

popup.js (The "Front Desk")

Role: The brain of the storefront. It runs when the popup opens.

Job 1: Sends the first message to the "Office" (background.js) saying, "Hey, the user is on this tab, please start the process."

Job 2: Listens for all messages from the "Office" (e.g., authRequired, showNewContact, showError) and then updates the popup.html to show the correct UI state.

content_script.js (The "Robot")

Role: The scraper. This script is "injected" into the LinkedIn profile page when needed.

Job: Finds the Name, Title, and "About" text on the page and "mails" (sends a message) this data back to the "Office."

background.js (The "Office")

Role: The "service worker" and the main brain of the entire operation. It's always ready, but not always "on."

Job: It's a "listener." It waits for messages from the "Front Desk" (popup.js).

When it gets a message, it executes the full workflow:

Gets auth (getAuthToken).

Injects the "Robot" (content_script.js) and waits for the data.

Gets the AI summary (getAISummary).

Searches contacts (searchContacts).

Sends a final "state" message (e.g., showNewContact) back to the "Front Desk" (popup.js).

3. The Communication Flow (The "Messaging System")

This was our biggest bug hunt. The entire system works on chrome.runtime.sendMessage.

User clicks the L3 icon.

popup.js runs and sends { action: "processProfile" } to background.js.

background.js wakes up, catches this message, and starts its workflow (auth, scrape, AI, search).

After a few milliseconds, background.js figures out what to do and sends a message back to popup.js, like { action: "showNewContact", data: {...} }.

popup.js is listening for this message, catches it, and runs the showState('new-contact-state') function to update the UI.