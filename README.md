Link3d.world-genesis (Chrome AI Hackathon)

Link3d-Memory is a Chrome extension built for the Google Chrome AI Hackathon. It uses the built-in chrome.ai (Gemini Nano) to turn your Google Contacts into a lightweight, intelligent "memory" CRM.

The Problem

You meet (or re-discover) interesting people on LinkedIn, but your Google Contacts are "dumb." They just store a name and an email. When you see "Nirav Shah" in your contacts, you have no context of who he is or why he's there.

Our Solution: The "AI-Memory"

Link3d-Memory solves this by creating an AI-powered "memory" of your contacts.

When you're on a LinkedIn profile and click the Link3d icon, the extension:

Scrapes the profile for their Name, Title, and "About" section.

Uses chrome.ai to instantly create a one-sentence AI summary of their bio (e.g., "Experienced banking and tech exec building a global financial solution.").

Searches your Google Contacts to see if you already know them.

This leads to two powerful workflows:

1. New Contact: Add a Memory

If they're a new contact, Link3d creates a new Google Contact for you, automatically adding:

Full Name

Job Title

LinkedIn Profile URL

The AI-Generated "Memory" (in the "Notes" field)

2. Existing Contact: Update Your Memory

If you already have them in your contacts, Link3d appends the new AI-generated summary with a timestamp to their notes.

Now, your contact's note field looks like this:

[10/30/2025]: "Experienced banking and tech exec building a new financial solution."

[05/15/2026]: "Just raised a $10M Series A for his new venture, Kosha."

You get a running history of their career and your relationship, turning Google Contacts into the simplest, smartest CRM you've ever used.

Tech Stack (Hackathon Focus)

chrome.ai (Gemini Nano): The core of our project. Used for on-device, instant summarization of the LinkedIn "About" section.

chrome.identity: For secure, seamless Google OAuth2.

background.js (Service Worker): Handles all logic.

Google People API: Used to search, create, and update contacts.

This is a hackathon project. It is not an official product and is not affiliated with LinkedIn or Google.
