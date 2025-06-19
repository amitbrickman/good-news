// Content script that runs on target news pages
// This script extracts news and replaces bad news with good news

// Store original news data for reference
let originalNewsData = [];
let convertedNewsData = [];

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractNews') {
        const news = extractNewsFromN12();
        sendResponse({ news });
    } else if (request.action === 'replaceNews') {
        replaceNewsOnPage(request.convertedNews);
        sendResponse({ success: true });
    }
});

// Function to extract news from target page using configurable selectors
function extractNewsFromN12() {
    const newsItems = [];
    const titleSelector = TARGET_TITLE_SELECTOR;
    const subtitleSelector = TARGET_SUBTITLE_SELECTOR;
    const maxNewsItems = MAX_NEWS_ITEMS;
    const maxDescriptionLength = MAX_DESCRIPTION_LENGTH;

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
            description: description || 'No description available',
            element: element // Store reference to the DOM element
        });
    });

    // Remove duplicates and limit to max news items
    const uniqueNews = newsItems.filter((item, index, self) =>
        index === self.findIndex(t => t.title === item.title)
    ).slice(0, maxNewsItems);

    // Store original news data
    originalNewsData = uniqueNews.map(item => ({
        title: item.title,
        description: item.description
    }));

    return uniqueNews;
}

// Function to replace news text on the page
function replaceNewsOnPage(convertedNews) {
    if (!convertedNews || convertedNews.length === 0) {
        return;
    }

    // Find all title elements again
    const titleSelector = TARGET_TITLE_SELECTOR;
    const subtitleSelector = TARGET_SUBTITLE_SELECTOR;
    const titleElements = document.querySelectorAll(titleSelector);

    titleElements.forEach((element, index) => {
        const originalText = element.textContent.trim();

        // Find matching converted news by comparing with originalBadNews.title
        const matchingConvertedNews = convertedNews.find(news => {
            // Check if the news has originalBadNews and the title matches
            if (news.originalBadNews && news.originalBadNews.title === originalText) {
                return true;
            }
            // Also check if the news has a title field that matches (fallback)
            if (news.title && news.title === originalText) {
                return true;
            }
            return false;
        });

        if (matchingConvertedNews) {
            // Replace the title text with good news
            element.textContent = matchingConvertedNews.title;
            element.style.fontWeight = 'bold';

            // Also replace the description if available
            if (matchingConvertedNews.description) {
                // First try to find subtitle within the same parent container
                let subtitleElement = null;
                const parent = element.closest('article, .news-item, .post, .entry, [class*="news"], [class*="article"], .item, .story');

                if (parent) {
                    subtitleElement = parent.querySelector(subtitleSelector);
                }

                // If not found in parent, look for subtitle as a sibling or nearby element
                if (!subtitleElement) {
                    // Look for subtitle as next sibling
                    let sibling = element.nextElementSibling;
                    while (sibling && !subtitleElement) {
                        if (sibling.getAttribute('data-type') === 'subtitle') {
                            subtitleElement = sibling;
                            break;
                        }
                        sibling = sibling.nextElementSibling;
                    }
                }

                // If still not found, look for any subtitle element that might be related
                if (!subtitleElement) {
                    // Look for subtitle elements in the same section or nearby
                    const nearbySubtitles = document.querySelectorAll(subtitleSelector);
                    if (nearbySubtitles.length > 0) {
                        // Find the closest subtitle to this title element
                        let closestDistance = Infinity;
                        nearbySubtitles.forEach((subtitle, index) => {
                            const distance = Math.abs(subtitle.offsetTop - element.offsetTop);
                            if (distance < closestDistance) {
                                closestDistance = distance;
                                subtitleElement = subtitle;
                            }
                        });
                    }
                }

                if (subtitleElement) {
                    // Store original description if not already stored
                    if (!subtitleElement.dataset.originalDescription) {
                        subtitleElement.dataset.originalDescription = subtitleElement.textContent.trim();
                    }

                    // Replace the description
                    subtitleElement.textContent = matchingConvertedNews.description;
                    subtitleElement.style.fontWeight = 'bold';
                } else {
                    // Try to create a subtitle element if none exists
                    const parent = element.closest('article, .news-item, .post, .entry, [class*="news"], [class*="article"], .item, .story');
                    if (parent) {
                        const newSubtitle = document.createElement('div');
                        newSubtitle.setAttribute('data-type', 'subtitle');
                        newSubtitle.textContent = matchingConvertedNews.description;
                        newSubtitle.style.fontWeight = 'bold';
                        newSubtitle.style.marginTop = '5px';
                        newSubtitle.style.fontSize = '0.9em';
                        newSubtitle.style.color = '#666';

                        // Insert after the title element
                        element.parentNode.insertBefore(newSubtitle, element.nextSibling);
                    }
                }
            } else {
                console.log('No description available in converted news');
            }
        }
    });
}

// Function to restore original news (if needed)
function restoreOriginalNews() {
    const titleSelector = TARGET_TITLE_SELECTOR;
    const subtitleSelector = TARGET_SUBTITLE_SELECTOR;

    const titleElements = document.querySelectorAll(titleSelector);

    titleElements.forEach((element, index) => {
        if (originalNewsData[index]) {
            element.textContent = originalNewsData[index].title;
            element.style.color = '';
            element.style.fontWeight = '';
        }
    });

    // Restore original descriptions
    const subtitleElements = document.querySelectorAll(subtitleSelector);
    subtitleElements.forEach(element => {
        if (element.dataset.originalDescription) {
            element.textContent = element.dataset.originalDescription;
            element.style.color = '';
            element.style.fontWeight = '';
            delete element.dataset.originalDescription;
        }
    });
}