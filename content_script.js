// This script is injected by `background.js` to scrape the page.
// It runs in an isolated world, so we send the data back via the chrome.runtime.sendMessage API.

function scrapeProfile() {
    // --- Helper to find elements safely ---
    // LinkedIn selectors are obfuscated and change often. This is a best-guess for a hackathon.
    const findElement = (selector) => document.querySelector(selector)?.textContent.trim() || null;

    // --- Scrape Key Data ---
    // 1. Scrape Name (usually the h1)
    const name = findElement('h1.text-heading-xlarge');

    // 2. Scrape Title (just below the name)
    const title = findElement('div.text-body-medium.break-words');
    
    // 3. Scrape "About" section
    // This is the hardest. We look for a section with an "About" h2, then find the text.
    let about = null;
    try {
        const allSections = document.querySelectorAll('section');
        for (const section of allSections) {
            const h2 = section.querySelector('h2.pvs-header__title span[aria-hidden="true"]');
            if (h2 && h2.textContent.includes('About')) {
                // Found the "About" section. The text is often in a sibling or child div.
                // This selector is fragile and specific to this hackathon.
                const aboutTextElement = section.querySelector('div.inline-show-more-text > span[aria-hidden="true"]');
                if (aboutTextElement) {
                    about = aboutTextElement.textContent.trim();
                    break;
                }
            }
        }
    } catch (e) {
        console.error('Link3d: Error scraping About section', e);
    }
    
    if (!name || !about) {
        return { 
            status: 'error', 
            message: 'Could not find Name or About section on this profile. LinkedIn selectors may have changed.' 
        };
    }

    return {
        status: 'success',
        data: {
            name: name,
            title: title || '', // Title can be blank
            about: about,
            profileUrl: window.location.href
        }
    };
}

// --- Send the data back ---
// We don't use a listener here. The background script executes this file,
// and this 'scrapeProfile()' function's *result* is what's returned to the background.
scrapeProfile();
