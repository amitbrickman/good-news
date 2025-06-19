// --- End configuration ---

document.addEventListener('DOMContentLoaded', async function () {
    // On popup open, check if the current tab is N12. If not, show error immediately.
    const scanButton = document.getElementById('scanButton');
    const buttonText = document.getElementById('buttonText');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const targetWebsite = typeof TARGET_WEBSITE !== 'undefined' ? TARGET_WEBSITE : 'n12.co.il';
    if (!tab.url.includes(targetWebsite)) {
        document.body.style.background = '#181818';
        if (scanButton && document.body.contains(scanButton)) scanButton.remove();
        const disclaimer = document.querySelector('.disclaimer');
        if (disclaimer && document.body.contains(disclaimer)) disclaimer.remove();
        const logo = document.querySelector('.n12-logo');
        if (logo && document.body.contains(logo)) logo.remove();
        const chip = document.querySelector('.credit-chip');
        if (chip) chip.classList.add('dark');
        showErrorMessage('This extension only works on N12.co.il');
        return;
    }

    scanButton.addEventListener('click', async function () {
        if (scanButton.disabled) return;
        try {
            const totalStart = Date.now();
            scanButton.disabled = true;
            buttonText.textContent = 'Loading...';

            // Always get the active tab here
            console.log('[GoodNews] Getting active tab...');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Check if config is loaded (catch ReferenceError)
            try {
                if (typeof TARGET_TITLE_SELECTOR === 'undefined') {
                    throw new ReferenceError('TARGET_TITLE_SELECTOR is not defined');
                }
            } catch (err) {
                if (err instanceof ReferenceError) {
                    document.body.style.background = '#181818';
                    if (scanButton && document.body.contains(scanButton)) scanButton.remove();
                    const disclaimer = document.querySelector('.disclaimer');
                    if (disclaimer && document.body.contains(disclaimer)) disclaimer.remove();
                    const logo = document.querySelector('.n12-logo');
                    if (logo && document.body.contains(logo)) logo.remove();
                    const chip = document.querySelector('.credit-chip');
                    if (chip) chip.classList.add('dark');
                    showErrorMessage('Oops! something happened', 'try refreshing the page and try again');
                    return;
                } else {
                    throw err;
                }
            }

            // Check if we're on target website
            const targetWebsite = typeof TARGET_WEBSITE !== 'undefined' ? TARGET_WEBSITE : 'n12.co.il';
            if (!tab.url.includes(targetWebsite)) {
                document.body.style.background = '#181818';
                if (scanButton && document.body.contains(scanButton)) scanButton.remove();
                const disclaimer = document.querySelector('.disclaimer');
                if (disclaimer && document.body.contains(disclaimer)) disclaimer.remove();
                const logo = document.querySelector('.n12-logo');
                if (logo && document.body.contains(logo)) logo.remove();
                const chip = document.querySelector('.credit-chip');
                if (chip) chip.classList.add('dark');
                showErrorMessage('This extension only works on N12.co.il');
                return;
            }

            console.log('[GoodNews] Starting extraction...');
            const extractionStart = Date.now();
            const newsData = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractNewsFromN12
            });
            const extractedNews = newsData[0].result;
            const extractionEnd = Date.now();
            console.log(`[GoodNews] Extraction done in ${extractionEnd - extractionStart}ms`);

            if (!extractedNews || extractedNews.length === 0) {
                buttonText.textContent = 'Give Me Good News';
                scanButton.disabled = false;
                return;
            }

            console.log('[GoodNews] Starting API call...');
            const apiStart = Date.now();
            const convertedNews = await convertNews(extractedNews);
            const apiEnd = Date.now();
            console.log(`[GoodNews] API call done in ${apiEnd - apiStart}ms`);

            // Send converted news back to content script to replace on page
            await chrome.tabs.sendMessage(tab.id, {
                action: 'replaceNews',
                convertedNews: convertedNews
            });

            // Change popup background and remove button/disclaimer
            document.body.style.background = '#F8BFC6';
            if (scanButton && document.body.contains(scanButton)) scanButton.remove();
            const disclaimer = document.querySelector('.disclaimer');
            if (disclaimer && document.body.contains(disclaimer)) disclaimer.remove();
            // Add a message below the logo
            const logo = document.querySelector('.n12-logo');
            if (logo) {
                const msg = document.createElement('div');
                msg.textContent = 'Enjoy The News :)';
                msg.style.textAlign = 'center';
                msg.style.fontFamily = 'Poppins, Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
                msg.style.fontWeight = '600';
                msg.style.fontSize = '14px';
                msg.style.position = 'relative';
                msg.style.top = '-20px';
                msg.style.background = '#ffffff4a';
                msg.style.borderRadius = '2px';
                msg.style.padding = '3px 7px';
                msg.style.color = 'white';
                logo.insertAdjacentElement('afterend', msg);
            }
            const totalEnd = Date.now();
            console.log(`[GoodNews] Total time: ${totalEnd - totalStart}ms`);
        } catch (error) {
            console.error('Error:', error);
            document.body.style.background = '#181818';
            if (scanButton && document.body.contains(scanButton)) scanButton.remove();
            const disclaimer = document.querySelector('.disclaimer');
            if (disclaimer && document.body.contains(disclaimer)) disclaimer.remove();
            const logo = document.querySelector('.n12-logo');
            if (logo && document.body.contains(logo)) logo.remove();
            const chip = document.querySelector('.credit-chip');
            if (chip) chip.classList.add('dark');
            showErrorMessage('Oops! something happened', 'try refreshing the page and try again');
        }
    });
});

// Function to extract news from N12 page (will be injected into the page)
function extractNewsFromN12() {
    const newsItems = [];
    const titleSelector = TARGET_TITLE_SELECTOR;
    const subtitleSelector = TARGET_SUBTITLE_SELECTOR;
    const maxNewsItems = MAX_NEWS_ITEMS || 10;
    const maxDescriptionLength = MAX_DESCRIPTION_LENGTH || 200;

    // Find all elements with title selector
    const titleElements = document.querySelectorAll(titleSelector);

    titleElements.forEach(element => {
        const text = element.textContent.trim();

        // Filter out very short or very long text
        if (text.length < 5 || text.length > 200) return;

        // Look for parent article or news container
        let description = '';
        const parent = element.closest('article, .news-item, .post, .entry, [class*="news"], [class*="article"], .item, .story');

        if (parent) {
            // Try to find description using subtitle selector first
            const subtitleElement = parent.querySelector(subtitleSelector);
            if (subtitleElement) {
                description = subtitleElement.textContent.trim().substring(0, maxDescriptionLength);
            } else {
                // Fallback to other description selectors
                const descSelectors = ['p', '.description', '.excerpt', '.summary', '.content', '.subtitle', '.lead'];
                for (const selector of descSelectors) {
                    const descElement = parent.querySelector(selector);
                    if (descElement && descElement !== element) {
                        description = descElement.textContent.trim().substring(0, maxDescriptionLength);
                        break;
                    }
                }
            }
        }

        // If no description found, use a snippet from nearby text
        if (!description) {
            const nextElement = element.nextElementSibling;
            if (nextElement && nextElement.tagName === 'P') {
                description = nextElement.textContent.trim().substring(0, maxDescriptionLength);
            }
        }

        newsItems.push({
            title: text,
            description: description || 'No description available'
        });
    });

    // Remove duplicates and limit to max news items
    const uniqueNews = newsItems.filter((item, index, self) =>
        index === self.findIndex(t => t.title === item.title)
    ).slice(0, maxNewsItems);

    return uniqueNews;
}

// Function to convert news using the API
async function convertNews(newsItems) {
    const apiUrl = MASTRA_API_URL;

    const requestBody = {
        messages: [
            {
                role: 'user',
                content: `news: ${JSON.stringify(newsItems)}`
            }
        ]
    };

    const headers = {
        'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Parse the response - the AI should return JSON with goodNewsList
    try {
        let responseText = data.text || data.content || '{}';

        // Clean the response text to remove markdown formatting
        responseText = cleanJsonResponse(responseText);

        // Try to parse the cleaned response as JSON
        const parsedResponse = JSON.parse(responseText);
        return parsedResponse.goodNewsList || [];
    } catch (e) {
        // If parsing fails, return the raw text response
        console.warn('Could not parse API response as JSON:', e);
        return [{
            title: 'Converted News',
            description: data.text || data.content || 'Conversion completed',
            originalBadNews: newsItems[0] || { title: 'Unknown', description: 'Unknown' }
        }];
    }
}

// Helper function to clean JSON response from markdown formatting
function cleanJsonResponse(text) {
    // Remove markdown code blocks
    text = text.replace(/```json\s*/g, '');
    text = text.replace(/```\s*$/g, '');

    // Remove any leading/trailing whitespace
    text = text.trim();

    // If the text doesn't start with {, try to find JSON object
    if (!text.startsWith('{')) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            text = jsonMatch[0];
        }
    }

    return text;
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showErrorMessage(msg, subtext) {
    // Remove any previous error
    let errorDiv = document.getElementById('popup-error-message');
    if (errorDiv) errorDiv.remove();
    errorDiv = document.createElement('div');
    errorDiv.id = 'popup-error-message';
    errorDiv.style.position = 'absolute';
    errorDiv.style.top = '50%';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translate(-50%, -50%)';
    errorDiv.style.color = '#fff';
    errorDiv.style.background = 'transparent';
    errorDiv.style.fontFamily = 'Poppins, Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.padding = '0 10px';
    errorDiv.style.zIndex = '100';
    errorDiv.style.width = '90%';
    errorDiv.style.maxWidth = '210px';
    if (msg === 'This extension only works on N12.co.il') {
        // Create a span for the first part
        const span1 = document.createElement('span');
        span1.textContent = 'This extension only works on ';
        errorDiv.appendChild(span1);
        // Create the link
        const link = document.createElement('a');
        link.href = 'https://www.n12.co.il';
        link.textContent = 'N12.co.il';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.color = '#fff';
        link.style.textDecoration = 'underline';
        link.style.cursor = 'pointer';
        link.style.transition = 'text-decoration 0.2s';
        link.style.whiteSpace = 'nowrap';
        link.style.overflow = 'hidden';
        link.style.textOverflow = 'ellipsis';
        link.addEventListener('mouseover', () => { link.style.textDecoration = 'underline'; });
        link.addEventListener('mouseout', () => { link.style.textDecoration = 'underline'; });
        errorDiv.appendChild(link);
    } else if (msg === 'Oops! something happened') {
        // Custom error layout
        const oops = document.createElement('div');
        oops.textContent = 'Oops!';
        oops.style.fontWeight = '900';
        oops.style.fontSize = '22px';
        oops.style.marginBottom = '2px';
        oops.style.whiteSpace = 'nowrap';
        oops.style.overflow = 'hidden';
        oops.style.textOverflow = 'ellipsis';
        errorDiv.appendChild(oops);
        const something = document.createElement('div');
        something.textContent = 'Something happened';
        something.style.fontWeight = '600';
        something.style.fontSize = '14px';
        something.style.marginBottom = '2px';
        something.style.whiteSpace = 'nowrap';
        something.style.overflow = 'hidden';
        something.style.textOverflow = 'ellipsis';
        errorDiv.appendChild(something);
        const tryAgain = document.createElement('div');
        tryAgain.textContent = 'try refreshing the page and try again';
        tryAgain.style.fontWeight = '400';
        tryAgain.style.fontSize = '11px';
        tryAgain.style.opacity = '0.7';
        tryAgain.style.whiteSpace = 'nowrap';
        tryAgain.style.overflow = 'hidden';
        tryAgain.style.textOverflow = 'ellipsis';
        errorDiv.appendChild(tryAgain);
    } else {
        errorDiv.textContent = msg;
    }
    document.body.appendChild(errorDiv);
} 