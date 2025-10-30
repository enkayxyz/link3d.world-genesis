# LinkedIn Profile to Google Contacts with AI

Chrome AI Hackathon: A Chrome Manifest V3 extension using built-in AI to summarize LinkedIn profiles and sync them as "memories" to Google Contacts.

## Overview

This extension automates the process of saving LinkedIn connections to Google Contacts with AI-powered professional summaries. When you visit a LinkedIn profile, the extension:

1. **Scrapes** the profile's Name, Title, and About section
2. **Summarizes** the About section using Chrome's built-in AI
3. **Checks** if the contact already exists in Google Contacts
4. **Creates or Updates** the contact with all relevant information

## Quick Start

See [SETUP.md](SETUP.md) for detailed setup instructions.

### Basic Setup

1. Load the extension in Chrome (`chrome://extensions/`)
2. Configure Google Cloud OAuth credentials
3. Visit any LinkedIn profile page
4. Click the extension icon to sync the contact

## Features

✅ **Smart Scraping** - Extracts name, title, and about section from LinkedIn profiles  
✅ **AI Summarization** - Uses Chrome's built-in AI to create professional summaries  
✅ **Google Integration** - Seamlessly syncs with Google Contacts  
✅ **Duplicate Detection** - Checks if contact already exists  
✅ **Smart Updates** - Appends timestamped notes to existing contacts  
✅ **Clean UI** - Professional popup interface with status indicators

## Tech Stack

- **Manifest V3** - Latest Chrome extension standard
- **Chrome AI API** - Built-in AI for summarization
- **Chrome Identity API** - OAuth authentication
- **Google People API** - Contact management
- **Vanilla JavaScript** - No dependencies, lightweight

## Project Structure

```
├── manifest.json          # Extension configuration (MV3)
├── popup.html            # User interface
├── popup.js              # UI logic and orchestration
├── content_script.js     # LinkedIn profile scraper
├── background.js         # Service worker for API calls
├── icons/                # Extension icons
├── SETUP.md             # Detailed setup guide
└── README.md            # This file
```

## Usage

1. Navigate to a LinkedIn profile (e.g., `linkedin.com/in/username`)
2. Click the extension icon in your toolbar
3. Wait for the extension to scrape and process the profile
4. Click "New Contact" to create a new contact, or
5. Click "Update Contact" to append new information to an existing contact

## Development

### Testing Locally

1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click the reload button on the extension card
4. Test on a LinkedIn profile page

### Debugging

- **Popup**: Right-click extension icon → "Inspect popup"
- **Content Script**: Open LinkedIn page → F12 → Console
- **Background**: `chrome://extensions/` → "service worker"

## Security & Privacy

- All data processing happens locally in your browser
- No third-party servers involved (except Google APIs)
- OAuth tokens managed securely by Chrome Identity API
- Only accesses LinkedIn data when you explicitly trigger the extension

## License

See [LICENSE](LICENSE) file for details.

## Contributing

This is a hackathon project, but contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests
- Fork and create your own version

## Hackathon

Built for the Chrome AI Hackathon 🚀

**Challenge**: Use Chrome's built-in AI to create practical extensions that enhance productivity and user experience.
