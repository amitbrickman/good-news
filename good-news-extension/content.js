// Content script that runs on target news pages
// This script extracts news and replaces bad news with good news

console.log('Good News Converter: Content script loaded on', TARGET_WEBSITE);

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
        console.log('No converted news to replace');
        return;
    }

    console.log('Received converted news:', convertedNews);

    // Find all title elements again
    const titleSelector = TARGET_TITLE_SELECTOR;
    const subtitleSelector = TARGET_SUBTITLE_SELECTOR;
    const titleElements = document.querySelectorAll(titleSelector);
    console.log('Found title elements:', titleElements.length);

    titleElements.forEach((element, index) => {
        const originalText = element.textContent.trim();
        console.log(`Processing title ${index}: "${originalText}"`);

        // Find matching converted news by comparing with originalBadNews.title
        const matchingConvertedNews = convertedNews.find(news => {
            // Check if the news has originalBadNews and the title matches
            if (news.originalBadNews && news.originalBadNews.title === originalText) {
                console.log(`Found match via originalBadNews.title: "${news.originalBadNews.title}"`);
                return true;
            }
            // Also check if the news has a title field that matches (fallback)
            if (news.title && news.title === originalText) {
                console.log(`Found match via news.title: "${news.title}"`);
                return true;
            }
            return false;
        });

        if (matchingConvertedNews) {
            console.log(`Matched with converted news:`, matchingConvertedNews);

            // Replace the title text with good news
            element.textContent = matchingConvertedNews.title;
            element.style.fontWeight = 'bold';

            console.log(`Replaced title: "${originalText}" with "${matchingConvertedNews.title}"`);

            // Also replace the description if available
            if (matchingConvertedNews.description) {
                console.log(`Looking for subtitle for title: "${originalText}"`);
                console.log(`Description to replace with: "${matchingConvertedNews.description}"`);

                // First try to find subtitle within the same parent container
                let subtitleElement = null;
                const parent = element.closest('article, .news-item, .post, .entry, [class*="news"], [class*="article"], .item, .story');

                if (parent) {
                    console.log('Found parent container:', parent.tagName, parent.className);
                    subtitleElement = parent.querySelector(subtitleSelector);
                    if (subtitleElement) {
                        console.log('Found subtitle in parent container');
                    }
                }

                // If not found in parent, look for subtitle as a sibling or nearby element
                if (!subtitleElement) {
                    console.log('Looking for subtitle as sibling...');
                    // Look for subtitle as next sibling
                    let sibling = element.nextElementSibling;
                    while (sibling && !subtitleElement) {
                        if (sibling.getAttribute('data-type') === 'subtitle') {
                            subtitleElement = sibling;
                            console.log('Found subtitle as sibling');
                            break;
                        }
                        sibling = sibling.nextElementSibling;
                    }
                }

                // If still not found, look for any subtitle element that might be related
                if (!subtitleElement) {
                    console.log('Looking for nearby subtitle elements...');
                    // Look for subtitle elements in the same section or nearby
                    const nearbySubtitles = document.querySelectorAll(subtitleSelector);
                    console.log(`Found ${nearbySubtitles.length} subtitle elements on page`);
                    if (nearbySubtitles.length > 0) {
                        // Find the closest subtitle to this title element
                        let closestDistance = Infinity;
                        nearbySubtitles.forEach((subtitle, index) => {
                            const distance = Math.abs(subtitle.offsetTop - element.offsetTop);
                            console.log(`Subtitle ${index}: distance=${distance}, text="${subtitle.textContent.trim()}"`);
                            if (distance < closestDistance) {
                                closestDistance = distance;
                                subtitleElement = subtitle;
                            }
                        });
                        if (subtitleElement) {
                            console.log(`Selected closest subtitle at distance ${closestDistance}`);
                        }
                    }
                }

                if (subtitleElement) {
                    console.log(`Found subtitle element: "${subtitleElement.textContent.trim()}"`);
                    // Store original description if not already stored
                    if (!subtitleElement.dataset.originalDescription) {
                        subtitleElement.dataset.originalDescription = subtitleElement.textContent.trim();
                    }

                    // Replace the description
                    subtitleElement.textContent = matchingConvertedNews.description;
                    subtitleElement.style.fontWeight = 'bold';

                    console.log(`Replaced description with: "${matchingConvertedNews.description}"`);
                } else {
                    console.log('No subtitle element found for this news item');
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
                        console.log(`Created new subtitle with: "${matchingConvertedNews.description}"`);
                    }
                }
            } else {
                console.log('No description available in converted news');
            }
        } else {
            console.log(`No matching converted news found for: "${originalText}"`);
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