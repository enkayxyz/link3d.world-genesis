# Quick Reference Guide

## One-Minute Overview

This Chrome extension scrapes LinkedIn profiles, uses AI to summarize them, and syncs to Google Contacts.

**What it does:**
1. Scrapes LinkedIn profile → Gets Name, Title, About
2. AI summarizes → Creates professional "memory"
3. Checks Google Contacts → Already exists?
4. User clicks button → Creates or updates contact

## Installation (30 seconds)

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select this folder
4. Done!

## Configuration (5 minutes)

1. **Google Cloud Console:**
   - Enable Google People API
   - Create OAuth credentials (Chrome extension type)
   - Copy Client ID

2. **Update manifest.json:**
   - Replace `YOUR_CLIENT_ID` with your actual Client ID

3. **Add Extension ID to OAuth:**
   - Copy extension ID from chrome://extensions/
   - Add to Google Cloud OAuth credentials

## Usage (10 seconds)

1. Go to any LinkedIn profile
2. Click extension icon
3. Click "New Contact" or "Update Contact"

## File Structure at a Glance

```
manifest.json      → Configuration
popup.html/js      → UI
content_script.js  → Scraper
background.js      → API calls
```

## Key Code Snippets

### Scrape LinkedIn Profile
```javascript
// content_script.js
const name = document.querySelector('h1.text-heading-xlarge').textContent;
const title = document.querySelector('.text-body-medium').textContent;
const about = document.querySelector('#about')
  .closest('section')
  .querySelector('.inline-show-more-text')
  .textContent;
```

### Use Chrome AI
```javascript
// popup.js
const aiAPI = chrome.ai || chrome.aiOriginTrial;
const session = await aiAPI.languageModel.create({
  systemPrompt: 'Summarize into 2-3 sentences...'
});
const summary = await session.prompt(aboutText);
```

### Check Contact Exists
```javascript
// background.js
const searchUrl = `${GOOGLE_PEOPLE_API_BASE}/people:searchContacts?query=${name}`;
const response = await fetch(searchUrl, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Create Contact
```javascript
// background.js
const contactData = {
  names: [{ displayName: name }],
  organizations: [{ title: title }],
  urls: [{ value: linkedInUrl }],
  biographies: [{ value: aiSummary }]
};
await fetch(`${API_BASE}/people:createContact`, {
  method: 'POST',
  body: JSON.stringify(contactData)
});
```

### Update Contact
```javascript
// background.js
const timestamp = new Date().toISOString();
const newNote = `[${timestamp}] ${aiMemory}`;
const updatedBio = existingBio + '\n\n' + newNote;
```

## Debugging

| Issue | Solution |
|-------|----------|
| "Could not connect" | Refresh LinkedIn page |
| "API request failed" | Check OAuth credentials |
| No AI summary | AI fallback active (normal) |
| Contact not created | Check Google API enabled |

## Quick Debug Commands

```bash
# View popup console
Right-click extension icon → "Inspect popup"

# View content script console
F12 on LinkedIn page → Console tab

# View background worker
chrome://extensions/ → "service worker" link
```

## Common Customizations

**Change AI prompt:**
```javascript
// popup.js, line 64
systemPrompt: 'Your custom prompt here'
```

**Adjust summary length:**
```javascript
// popup.js, line 58
profileData.about.substring(0, 200) // Change 200
```

**Add more profile fields:**
```javascript
// content_script.js - add new scraping logic
// background.js - add to contactData
```

## Permissions Explained Simply

| Permission | Why? |
|------------|------|
| `activeTab` | Check if on LinkedIn |
| `identity` | Google login |
| `storage` | Cache data (optional) |
| `scripting` | Inject scraper |
| `linkedin.com` | Read profile |
| `people.googleapis.com` | Contacts API |

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Popup opens on LinkedIn profile
- [ ] Name/title/about scraped correctly
- [ ] AI summary generated (or fallback)
- [ ] Google OAuth prompts for consent
- [ ] "New Contact" creates contact
- [ ] "Update Contact" appends note
- [ ] Timestamps added correctly

## Performance

- **Scraping:** ~100ms
- **AI Summary:** ~1-2 seconds (or instant fallback)
- **API Check:** ~500ms
- **Create/Update:** ~1 second

Total: ~3-4 seconds per profile

## Limitations

- Only works on LinkedIn profile pages (`/in/`)
- Chrome AI may not be available (fallback used)
- Requires Google account
- Rate limited by Google API (100 requests/day free tier)

## Next Steps

1. **For Development:**
   - Add error recovery
   - Batch processing
   - Custom field mapping
   - Local contact cache

2. **For Production:**
   - Replace placeholder icons
   - Add analytics
   - Submit to Chrome Web Store
   - Add user settings page

3. **For Hackathon:**
   - Record demo video
   - Prepare presentation
   - Document edge cases handled
   - Showcase AI integration

## Resources

- [Chrome Extension MV3 Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome AI Origin Trial](https://developer.chrome.com/docs/ai/)
- [Google People API](https://developers.google.com/people)
- [Chrome Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)

## Support

For issues or questions:
1. Check SETUP.md for detailed instructions
2. Check browser console for errors
3. Verify Google Cloud configuration
4. Test with different LinkedIn profiles

---

**Built with ❤️ for Chrome AI Hackathon**

*Ready to impress? Load the extension and try it!*
