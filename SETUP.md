# LinkedIn Profile to Google Contacts with AI - Setup Guide

This Chrome extension scrapes LinkedIn profile data, uses Chrome's built-in AI to summarize the "About" section, and syncs contacts to Google Contacts using the Google People API.

## Features

- ✅ Scrapes Name, Title, and About section from LinkedIn profiles
- ✅ Uses Chrome's built-in AI (`chrome.ai`) to generate professional summaries
- ✅ Integrates with Google Contacts via `chrome.identity` and People API
- ✅ Checks if contact already exists
- ✅ Creates new contacts with LinkedIn data and AI-generated memory
- ✅ Updates existing contacts by appending timestamped AI memories

## Prerequisites

1. **Chrome Browser** (version 115 or later recommended for MV3 support)
2. **Google Cloud Project** with Google People API enabled
3. **Chrome AI Origin Trial** token (optional, for AI features)

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google People API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google People API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Chrome Extension" as application type
   - Add your extension ID (you'll get this after loading the extension)
   - Add authorized scopes: `https://www.googleapis.com/auth/contacts`

5. Update `manifest.json`:
   - Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your actual client ID

### 2. Chrome AI Setup (Optional)

Chrome's built-in AI (`chrome.ai`) is currently in Origin Trial. To use it:

1. Sign up for the Origin Trial at [Chrome Origin Trials](https://developer.chrome.com/origintrials/)
2. Get your origin trial token
3. Add the token to your manifest.json (if required)

**Note**: The extension includes a fallback that creates summaries without AI if it's not available.

### 3. Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the extension directory

5. Copy the Extension ID from the extensions page
6. Update your Google Cloud OAuth credentials with this Extension ID

### 4. Update Icons (Optional)

The extension includes placeholder icons. For a professional look:

1. Create or download LinkedIn-themed icons in sizes: 16x16, 48x48, 128x128 pixels
2. Replace the files in the `icons/` directory
3. Keep the filenames as: `icon16.png`, `icon48.png`, `icon128.png`

## Usage

1. Navigate to any LinkedIn profile page (e.g., `https://www.linkedin.com/in/username`)
2. Click the extension icon in your Chrome toolbar
3. The extension will:
   - Scrape the profile name, title, and about section
   - Generate an AI summary of the about section
   - Check if the contact exists in Google Contacts
   - Show either "New Contact" or "Update Contact" button

4. Click **"New Contact"** to:
   - Create a new Google Contact
   - Add name, title, LinkedIn URL
   - Add AI-generated summary as biography/notes

5. Click **"Update Contact"** to:
   - Append a new timestamped AI memory to existing contact's notes
   - Preserve all existing contact information

## File Structure

```
link3d.world-genesis/
├── manifest.json          # Extension manifest (MV3)
├── popup.html            # Popup UI
├── popup.js              # Popup logic and interactions
├── content_script.js     # LinkedIn profile scraper
├── background.js         # Service worker for Google API integration
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── SETUP.md             # This file
```

## Permissions Explained

- `activeTab`: Access current tab to check if it's a LinkedIn profile
- `identity`: Use Chrome Identity API for Google OAuth authentication
- `storage`: Store extension data (if needed for caching)
- `scripting`: Inject content scripts into LinkedIn pages
- Host permissions for `linkedin.com` and Google People API

## Troubleshooting

### "Could not connect to LinkedIn page"
- Refresh the LinkedIn profile page
- Make sure you're on a profile URL (contains `/in/`)

### "API request failed"
- Check that Google People API is enabled in your Google Cloud project
- Verify OAuth credentials are correctly configured
- Make sure you've authorized the extension to access your Google account

### AI Summary Not Working
- Chrome AI is experimental and may not be available in all Chrome versions
- The extension will use a fallback summary method if AI is unavailable

### Contact Not Found/Created
- Verify you have internet connection
- Check that you've granted the extension permission to access Google Contacts
- Review the browser console for detailed error messages

## Development

### Testing Changes

1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click the reload icon on your extension card
4. Test on a LinkedIn profile page

### Debugging

- Open popup DevTools: Right-click extension icon > "Inspect popup"
- View content script logs: Open LinkedIn page > F12 > Console
- Check background script: `chrome://extensions/` > Click "service worker"

## Security & Privacy

- All data is processed locally in your browser
- OAuth tokens are managed securely by Chrome Identity API
- No data is sent to third-party servers (except Google APIs)
- LinkedIn profile data is only accessed when you explicitly use the extension

## License

See LICENSE file for details.

## Contributing

This is a hackathon project. Feel free to fork and improve!

## Future Enhancements

- Batch processing of multiple profiles
- Custom AI prompt configuration
- Support for more LinkedIn fields (education, experience, etc.)
- Export/import contacts
- Analytics on contact syncing

---

Built for Chrome AI Hackathon 🚀
