# Link3d Memory - AI-Powered Contact Intelligence

> **Chrome AI Hackathon 2025 Submission**  
> Transform your Google Contacts into an intelligent memory system using Chrome's built-in AI

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://github.com/enkayxyz/link3d.world-genesis)
[![AI Powered](https://img.shields.io/badge/AI-Chrome%20AI%20%2B%20Gemini-green)](https://github.com/enkayxyz/link3d.world-genesis)

## 🎯 The Problem

You meet interesting people on LinkedIn, but your Google Contacts are "dumb." When you see "Phylian Kipchirchir" in your contacts, you have no context of who they are, what they do, or why they matter to you.

## 💡 Our Solution

**Link3d Memory** creates an AI-powered "memory" for every contact, automatically:

1. **Scrapes LinkedIn profiles** for name, title, and bio
2. **Uses Chrome AI (Gemini Nano)** to generate intelligent summaries
3. **Syncs with Google Contacts** - creates new or updates existing contacts
4. **Tracks relationship history** with timestamped AI memories

### Visual Demo

When you click the extension on a LinkedIn profile:

```
┌─────────────────────────────────────────┐
│  ●  Link3d Memory                    ◉  │
├─────────────────────────────────────────┤
│  1→2→3→4→5→6→7  (Progress Tracker)     │
│  Scrape → AI → Chrome → Gemini →        │
│  Summary → Search → Sync                 │
├─────────────────────────────────────────┤
│  Phylian Kipchirchir                    │
│  AI Investment Analyst | Charted Growth │
│                                          │
│  AI Memory:                              │
│  Phylian is a Data Analyst and founder  │
│  of Charted Growth, providing AI market │
│  intelligence for investors & execs.    │
│                                          │
│  ✓ Synced to Google Contacts            │
└─────────────────────────────────────────┘
```

## 🚀 Features

### 🤖 **Dual AI System**
- **Chrome AI First**: Uses built-in Gemini Nano for instant, on-device processing
- **Gemini 2.0 Flash Fallback**: Cloud AI when Chrome AI unavailable
- **Smart Extraction**: Structured data extraction from LinkedIn profiles

### 📊 **FedEx-Style Progress Tracking**
- **7-step horizontal timeline** showing real-time progress
- **Color-coded states**: Gray (pending), Blue (active), Green (success), Red (failed)
- **Hover tooltips** for detailed step information
- **Persistent across views** - always visible

### 🔄 **Auto-Sync Workflow**
- **One-click operation**: Scan → Extract → Analyze → Sync
- **Smart contact detection**: Creates new or updates existing contacts
- **Timestamped memories**: Running history of your relationship
- **Google Contacts integration**: Seamless OAuth 2.0 authentication

### 🎨 **Clean, Modern UI**
- **650px horizontal layout** - all steps in one line
- **Glassmorphic design** with backdrop blur effects
- **Responsive animations** for step transitions
- **Professional visual hierarchy**

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Chrome AI (Gemini Nano)** | Primary on-device AI summarization |
| **Gemini 2.0 Flash API** | Fallback cloud AI with JSON mode |
| **Google People API** | Contact management & sync |
| **Chrome Extension Manifest V3** | Modern extension architecture |
| **OAuth 2.0** | Secure Google account authorization |

## 📦 Installation

### Prerequisites
- Google Chrome (v128+) with AI features enabled
- Gemini API key (for fallback)
- Google Cloud OAuth credentials

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/enkayxyz/link3d.world-genesis.git
   cd link3d.world-genesis
   ```

2. **Configure API Keys**
   ```bash
   # Create config.js (gitignored)
   cat > config.js << EOF
   export const GEMINI_API_KEY = "your-gemini-api-key-here";
   EOF
   ```

3. **Update OAuth Client ID**
   - Get OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)
   - Update `manifest.json`:
     ```json
     {
       "oauth2": {
         "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com"
       }
     }
     ```

4. **Load Extension**
   - Open Chrome: `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `link3d.world-genesis` folder

## 🎮 Usage

1. **Navigate** to any LinkedIn profile (e.g., `linkedin.com/in/username`)
2. **Click** the Link3d Memory extension icon
3. **Watch** the progress tracker as it:
   - Scrapes the profile
   - Extracts structured data
   - Generates AI summary (Chrome AI → Gemini fallback)
   - Searches Google Contacts
   - Auto-syncs (creates or updates contact)
4. **Done!** Contact is now in Google Contacts with AI memory

### Example Output

**Google Contact Note:**
```
[10/31/2025]: Phylian is a Data Analyst and founder of Charted Growth, 
providing AI market intelligence and data-driven insights on the AI sector 
for investors and executives.
```

## 🏗️ Architecture

```
┌─────────────┐
│   Popup.js  │ ← User Interface
│  (Frontend) │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ l3_analyzer │ ← Background Worker
│  _agent.js  │   (Orchestration)
└──────┬──────┘
       │
       ├→ l3_extractor.js ─→ LinkedIn DOM
       │
       ├→ Chrome AI (Gemini Nano)
       │     ↓ (fallback)
       └→ Gemini 2.0 Flash API
             ↓
       Google People API (Contacts)
```

## 🎯 Hackathon Highlights

### Why Link3d Memory Stands Out

1. **Real Chrome AI Usage**: Primary AI is Chrome's built-in Gemini Nano, not just API calls
2. **Practical Use Case**: Solves a real problem - dumb contacts become intelligent memories
3. **Production-Ready**: Full error handling, retry logic, OAuth integration
4. **Beautiful UX**: FedEx-like progress tracking with smooth animations
5. **Auto-Sync Magic**: One-click operation, no manual steps needed

### Chrome AI Implementation

- **Prompt API**: Uses `ai.languageModel.create()` for summarization
- **On-Device Processing**: Fast, private, no API rate limits
- **Graceful Fallback**: Automatically switches to Gemini 2.0 Flash if Chrome AI unavailable
- **JSON Mode**: Structured extraction with validation

## 📝 Project Files

```
link3d.world-genesis/
├── manifest.json          # Extension config + OAuth
├── popup.html            # UI (650px, horizontal progress)
├── popup.js              # Frontend logic + state management
├── l3_analyzer_agent.js  # Background worker + AI orchestration
├── l3_extractor.js       # LinkedIn scraping (semantic selectors)
├── config.js             # API keys (gitignored)
├── icons/                # Extension icons
└── docs/                 # Documentation
    ├── ARCHITECTURE.md   # System design
    ├── INSTALL.md        # Setup guide
    ├── TEST_CASES.md     # Testing scenarios
    └── HACKATHON_SPECS.md # Submission details
```

## 🐛 Known Limitations

- **Chrome AI EPP**: Requires Chrome with experimental AI features enabled
- **OAuth Setup**: Needs Google Cloud project setup for production use
- **LinkedIn Structure**: May break if LinkedIn changes their DOM structure
- **Rate Limits**: Gemini fallback has 15 RPM limit (free tier)

## 🚧 Future Roadmap

- [ ] Support for other social platforms (Twitter, GitHub)
- [ ] Voice memos attached to contacts
- [ ] Relationship strength scoring
- [ ] Meeting notes auto-sync
- [ ] Mobile companion app

## 👥 Team

**Solo Hackathon Project**
- Developed by: [@enkayxyz](https://github.com/enkayxyz)
- Hackathon: Chrome AI Hackathon 2025

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- Google Chrome AI Team for Gemini Nano integration
- Chrome Extensions team for Manifest V3 architecture
- Google People API for contact management

---

**Built with ❤️ for the Chrome AI Hackathon 2025**

chrome.identity: For secure, seamless Google OAuth2.

background.js (Service Worker): Handles all logic.

Google People API: Used to search, create, and update contacts.

This is a hackathon project. It is not an official product and is not affiliated with LinkedIn or Google.
