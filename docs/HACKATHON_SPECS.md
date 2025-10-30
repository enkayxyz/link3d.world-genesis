Hackathon Spec: Link3d-Memory (v2)

Project: Link3d-Memory
Goal: Win the Google Chrome AI Hackathon by using the chrome.ai API.
MVR (Minimum Viable Rebel): A Chrome extension that uses built-in AI to create "memories" of LinkedIn profiles and saves them to Google Contacts.

User Flow

Trigger: User visits a LinkedIn profile and clicks the Link3d extension icon (action).

Scrape: content_script.js scrapes the profile's Full Name, Job Title, and "About" Section Text.

Authorize: background.js ensures the user has authorized Google via chrome.identity (for the People API).

Parallel Ops: The background.js initiates two tasks at once:

AI Task: Feeds the "About" text to the chrome.ai API.

Prompt: "Summarize this professional bio in one sentence for a contact note."

Output: An "AI Memory" (e.g., "Founder at Kosha, building a global financial solution.").

Search Task: Calls the Google People API (people.searchContacts) using the Full Name to find a match.

Popup UI: The popup.html opens and displays a UI based on the result of the Search Task.

UI States

State A: New Contact

Trigger: Search task returns no match.

UI Shows:

"New Contact"

Name: [Scraped Name]

Title: [Scraped Title]

AI Memory: [AI-generated summary]

Button: Create Contact

Action: Clicking "Create" calls people.createContact. The new contact includes Name, Title, LinkedIn URL (as a website), and the AI Memory (in the notes field).

State B: Existing Contact

Trigger: Search task returns a match.

UI Shows:

"Existing Contact Found!"

Name: [Name from Google]

Button: Add Memory to Contact

New AI Memory: [AI-generated summary from this visit]

Action: Clicking "Add Memory" calls people.updateContact. The new AI Memory is appended (with a timestamp) to the existing contact's "Notes" field, preserving all previous notes.
