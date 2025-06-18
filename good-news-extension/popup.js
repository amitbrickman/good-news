// --- End configuration ---

document.addEventListener('DOMContentLoaded', function () {
    const scanButton = document.getElementById('scanButton');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');

    scanButton.addEventListener('click', async function () {
        try {
            // Disable button and show loading
            scanButton.disabled = true;
            loading.style.display = 'block';
            results.innerHTML = '';

            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Check if we're on target website
            const targetWebsite = TARGET_WEBSITE;
            if (!tab.url.includes(targetWebsite)) {
                results.innerHTML = `<div class="error">This extension only works on ${targetWebsite}</div>`;
                return;
            }

            // Execute content script to extract news
            const newsData = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractNewsFromN12
            });

            const extractedNews = newsData[0].result;

            if (!extractedNews || extractedNews.length === 0) {
                results.innerHTML = '<div class="no-news">No news found on this page</div>';
                return;
            }

            // Convert news using the API
            const convertedNews = await convertNews(extractedNews);

            // Send converted news back to content script to replace on page
            await chrome.tabs.sendMessage(tab.id, {
                action: 'replaceNews',
                convertedNews: convertedNews
            });

            // Display results
            displayResults(convertedNews);

        } catch (error) {
            console.error('Error:', error);
            results.innerHTML = `
        <div class="error">
          <strong>Error:</strong> ${error.message}
        </div>
      `;
        } finally {
            // Re-enable button and hide loading
            scanButton.disabled = false;
            loading.style.display = 'none';
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

// Function to display results
function displayResults(convertedNews) {
    const results = document.getElementById('results');

    if (!convertedNews || convertedNews.length === 0) {
        results.innerHTML = '<div class="no-news">No news could be converted</div>';
        return;
    }

    const newsHtml = convertedNews.map(news => `
    <div class="news-item">
      <h3>${escapeHtml(news.title)}</h3>
      <p>${escapeHtml(news.description)}</p>
      ${news.originalBadNews ? `
        <div class="original-news">
          <strong>Original:</strong> ${escapeHtml(news.originalBadNews.title)}
        </div>
      ` : ''}
    </div>
  `).join('');

    results.innerHTML = `
    <div class="success-message">
      <strong>✅ News converted and replaced on page!</strong>
      <p>Look for the bold text with 🌞 indicators on the ${TARGET_WEBSITE} page.</p>
      <p>Both titles and descriptions have been updated.</p>
    </div>
    ${newsHtml}
  `;
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
} 