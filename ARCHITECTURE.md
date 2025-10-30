# Extension Flow Diagram

## User Journey

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER NAVIGATES TO LINKEDIN PROFILE                       │
│    https://www.linkedin.com/in/username                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CONTENT SCRIPT LOADS (content_script.js)                 │
│    - Injected automatically via manifest.json               │
│    - Waits for message from popup                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. USER CLICKS EXTENSION ICON                               │
│    - Opens popup.html                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. POPUP INITIALIZES (popup.js)                             │
│    - Shows loading spinner                                   │
│    - Checks current tab URL                                  │
│    - Validates it's a LinkedIn profile                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. REQUEST PROFILE DATA                                     │
│    popup.js → content_script.js                             │
│    Message: { action: 'getProfileData' }                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. SCRAPE LINKEDIN PROFILE (content_script.js)              │
│    - Extract Name (h1 elements)                             │
│    - Extract Title (text-body-medium)                       │
│    - Extract About (multiple selectors)                     │
│    - Get current URL                                         │
│    Return: { name, title, about, url }                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. GENERATE AI SUMMARY (popup.js)                           │
│    - Check chrome.ai availability                           │
│    - Create AI session with system prompt                   │
│    - Generate 2-3 sentence summary                          │
│    - Fallback to truncated text if AI unavailable           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. CHECK IF CONTACT EXISTS                                  │
│    popup.js → background.js                                 │
│    Message: { action: 'checkContact', name, url }          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. QUERY GOOGLE CONTACTS (background.js)                    │
│    - Get OAuth token (chrome.identity)                      │
│    - Call People API searchContacts                         │
│    - Match by name and LinkedIn URL                         │
│    Return: { exists: true/false, contactId }               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. DISPLAY PROFILE IN POPUP                                │
│     - Show name, title, AI summary                          │
│     - Enable "New Contact" if not exists                    │
│     - Enable "Update Contact" if exists                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
              ┌────────────┴────────────┐
              ↓                         ↓
┌──────────────────────────┐  ┌──────────────────────────┐
│ A. USER CLICKS "NEW"     │  │ B. USER CLICKS "UPDATE"  │
└──────────────────────────┘  └──────────────────────────┘
              ↓                         ↓
┌──────────────────────────┐  ┌──────────────────────────┐
│ CREATE CONTACT           │  │ UPDATE CONTACT           │
│ (background.js)          │  │ (background.js)          │
│                          │  │                          │
│ POST to People API:      │  │ 1. GET existing contact  │
│ - names                  │  │ 2. Append timestamped    │
│ - organizations (title)  │  │    note to biography     │
│ - urls (LinkedIn)        │  │ 3. PATCH People API      │
│ - biographies (AI memo)  │  │                          │
└──────────────────────────┘  └──────────────────────────┘
              ↓                         ↓
              └────────────┬────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 11. SHOW SUCCESS MESSAGE                                    │
│     - "Contact created successfully!" or                    │
│     - "Contact updated successfully!"                       │
└─────────────────────────────────────────────────────────────┘
```

## Component Communication

```
┌─────────────────┐
│   popup.html    │  User Interface Layer
│   popup.js      │  - UI rendering
└────────┬────────┘  - User interactions
         │           - Orchestration
         ↓
    [Message Passing]
         │
    ┌────┴─────┐
    ↓          ↓
┌────────┐  ┌────────────┐
│content_│  │background  │
│script  │  │.js         │
│.js     │  │(Service    │
│        │  │Worker)     │
└────────┘  └─────┬──────┘
    │             │
    │             ↓
    │      [OAuth + API]
    │             │
    ↓             ↓
┌────────┐  ┌────────────┐
│LinkedIn│  │Google      │
│Profile │  │People API  │
│Page    │  │            │
└────────┘  └────────────┘
```

## Data Flow

```
LinkedIn Profile
    ↓
[Scrape: Name, Title, About]
    ↓
Profile Data Object
    ↓
[Chrome AI Processing]
    ↓
AI Memory (2-3 sentences)
    ↓
[Check Google Contacts]
    ↓
┌─────────┬─────────┐
│ Exists? │ Action  │
├─────────┼─────────┤
│ No      │ CREATE  │
│ Yes     │ UPDATE  │
└─────────┴─────────┘
    ↓
Google Contact
- Name: John Doe
- Title: Software Engineer
- URL: linkedin.com/in/johndoe
- Notes: [2025-10-30] Professional with 10 years...
```

## Error Handling

```
┌─────────────────┐
│ Any Operation   │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
[Success]  [Error]
    │         │
    ↓         ↓
[Continue] [Catch]
             │
        ┌────┴────┐
        │         │
    [Log]    [Fallback]
        │         │
        └────┬────┘
             ↓
    [User-friendly Message]
             ↓
    [Show in Popup UI]
```

## Security Layers

```
┌───────────────────────────────────┐
│ Manifest V3 Service Worker        │ ← No persistent background
├───────────────────────────────────┤
│ Content Security Policy           │ ← No eval, inline scripts
├───────────────────────────────────┤
│ chrome.identity OAuth             │ ← Secure token management
├───────────────────────────────────┤
│ Minimal Permissions               │ ← Only required APIs
├───────────────────────────────────┤
│ Host Permissions                  │ ← Only LinkedIn + Google
├───────────────────────────────────┤
│ HTTPS Only                        │ ← All API calls encrypted
└───────────────────────────────────┘
```
