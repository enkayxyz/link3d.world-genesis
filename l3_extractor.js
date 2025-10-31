/**
 * Link3d-Memory (AI Hackathon)
 *
 * l3_extractor.js (v26 - "AI-First Refined Robot")
 *
 * This is the "robot" agent. Its only job is to get text from the page.
 * This version is 100% focused on the "AI-First Refined" (Idea 2) approach.
 * It *only* looks for semantic containers (`<main>` or `[role='main']`).
 * It does NOT fall back to the `body`, which prevents the "firehose" crash.
 * This *should* fix the `message port closed` hang.
 */

// v26: List of "smart" semantic containers to try.
const SEMANTIC_SELECTORS = [
  'main', // The <body> of the main content
  'div[role="main"]' // A common ARIA equivalent
];
const WAIT_TIMEOUT_MS = 1500; // 1.5s for SPA to load

/**
 * This is the "v26 - AI-First Refined Robot" brain.
 * It runs inside *every* frame (including iframes).
 */
async function scrapeProfileFunction(selectors, timeout) {
  const log = (...args) => console.log("Link3d (Extractor v26):", ...args);

  const waitForElement = (doc, selector, waitMs) => {
    return new Promise((resolve) => {
      let el = doc.querySelector(selector);
      if (el) return resolve(el);
      const startTime = Date.now();
      const interval = setInterval(() => {
        el = doc.querySelector(selector);
        if (el) {
          clearInterval(interval);
          return resolve(el);
        }
        if (Date.now() - startTime > waitMs) {
          clearInterval(interval);
          return resolve(null);
        }
      }, 100);
    });
  };

  try {
    log("--- Checking frame... ---");
    let targetElement = null;

    // 1. Try "smart" semantic selectors
    for (const selector of selectors) {
      log(`Checking for semantic selector: ${selector}`);
  targetElement = await waitForElement(document, selector, timeout);
      if (targetElement) {
        log(`FOUND semantic container: ${selector}`);
        break; // We found the best one, stop looking
      }
    }

    let allText = "";
    let profileUrl = window.location.href;

    // 2. Extract text (ONLY if we found a smart container)
    if (targetElement) {
      // "Smart" path
      allText = targetElement.innerText;
      log(`Got ${allText.length} chars from semantic container.`);
    } else {
      // "AI-First (Refined)" path
      log("No semantic container found. This frame is useless.");
      return null; // This frame is empty or not the main one
    }
    
    // Check if we *actually* have profile text (not just nav bars)
    if (allText.length < 100) {
      log("Text is too short, probably not the main profile. Discarding.");
      return null;
    }

    // Success! This frame has the data.
    log("This frame has the data! Returning it.");
    return { allText, profileUrl };

  } catch (e) {
    log(`ERROR in scrapeProfileFunction: ${e.message}`);
    return { error: `Scraping crashed: ${e.message}` };
  }
}

/**
 * Main exported function. This is called by the "brain" (l3_analyzer_agent).
 * It injects the "Resilient Robot" (v26) into the page.
 */
export function extractProfileData(tabId, log) {
  log("Extractor(v26): Injecting 'AI-First Refined Robot' into tab:", tabId);
  
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId, allFrames: true }, // "Master Key"
        func: scrapeProfileFunction,
        args: [SEMANTIC_SELECTORS, WAIT_TIMEOUT_MS]
      },
      (injectionResults) => {
        if (chrome.runtime.lastError) {
          log("Extractor(v26): Injection FAILED:", chrome.runtime.lastError.message);
          return reject(new Error(chrome.runtime.lastError.message));
        }
        
        if (!injectionResults || injectionResults.length === 0) {
          log("Extractor(v26): Injection returned no results.");
          return reject(new Error("Script injection failed to return a result."));
        }

        log("Extractor(v26): Got results from ALL frames:", injectionResults);

        // Find the *best* result. We want the one with the most text.
        let bestResult = null;
        for (const frameResult of injectionResults) {
           if (frameResult.result && !frameResult.result.error && frameResult.result.allText) {
             if (!bestResult || frameResult.result.allText.length > bestResult.allText.length) {
               bestResult = frameResult.result;
             }
           }
        }
        
        if (bestResult) {
          log(`Extractor(v26): Found best data (${bestResult.allText.length} chars). Resolving.`);
          resolve(bestResult);
        } else {
          // Check if any frame returned an *error*
          const errorResult = injectionResults.find(r => r.result && r.result.error);
          if (errorResult) {
            log("Extractor(v26): A frame returned an error:", errorResult.result.error);
            return reject(new Error(errorResult.result.error));
          }
          // No frame found anything
          log("Extractor(v26): No semantic container returned valid data.");
          return reject(new Error("Could not find profile data in any frame."));
        }
      }
    );
  });
}

