// content_script.js - Scrape LinkedIn profile data

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProfileData') {
    try {
      const profileData = scrapeLinkedInProfile();
      sendResponse({ success: true, data: profileData });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // Keep message channel open for async response
});

// Scrape LinkedIn profile data
function scrapeLinkedInProfile() {
  const data = {
    name: '',
    title: '',
    about: '',
    url: window.location.href
  };
  
  try {
    // Extract name - LinkedIn profile name
    const nameElement = document.querySelector('h1.text-heading-xlarge') || 
                       document.querySelector('.pv-text-details__left-panel h1') ||
                       document.querySelector('.ph5 h1');
    if (nameElement) {
      data.name = nameElement.textContent.trim();
    }
    
    // Extract title/headline
    const titleElement = document.querySelector('.text-body-medium.break-words') ||
                        document.querySelector('.pv-text-details__left-panel .text-body-medium') ||
                        document.querySelector('.ph5 .text-body-medium');
    if (titleElement) {
      data.title = titleElement.textContent.trim();
    }
    
    // Extract about section
    const aboutSection = document.querySelector('#about') || 
                        document.querySelector('[data-section="summary"]');
    
    if (aboutSection) {
      // Find the about content - it's usually in a div following the about heading
      const aboutParent = aboutSection.closest('section');
      if (aboutParent) {
        const aboutContent = aboutParent.querySelector('.pv-shared-text-with-see-more .inline-show-more-text') ||
                           aboutParent.querySelector('.pv-about__summary-text') ||
                           aboutParent.querySelector('.display-flex.ph5 span[aria-hidden="true"]') ||
                           aboutParent.querySelector('.pv-shared-text-with-see-more span[aria-hidden="true"]');
        
        if (aboutContent) {
          data.about = aboutContent.textContent.trim();
        }
      }
    }
    
    // Alternative method to find about section
    if (!data.about) {
      const allSections = document.querySelectorAll('section');
      for (const section of allSections) {
        const heading = section.querySelector('h2, .pvs-header__title');
        if (heading && heading.textContent.toLowerCase().includes('about')) {
          const content = section.querySelector('.inline-show-more-text span[aria-hidden="true"]') ||
                         section.querySelector('.pv-shared-text-with-see-more span') ||
                         section.querySelector('.display-flex span[aria-hidden="true"]');
          if (content) {
            data.about = content.textContent.trim();
            break;
          }
        }
      }
    }
    
    // Validate that we got at least a name
    if (!data.name) {
      throw new Error('Could not find profile name. Make sure you are on a LinkedIn profile page.');
    }
    
    return data;
  } catch (error) {
    console.error('Error scraping LinkedIn profile:', error);
    throw error;
  }
}

// Auto-scrape when page is ready (optional - for debugging)
if (document.readyState === 'complete') {
  console.log('LinkedIn Profile Scraper: Content script loaded');
} else {
  window.addEventListener('load', () => {
    console.log('LinkedIn Profile Scraper: Content script loaded');
  });
}
