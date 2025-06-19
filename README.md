# Good News Project

This project consists of two main components:

1. **Mastra AI Agent**  
   An AI agent (using Mastra) that converts bad news into positive, funny, and culturally relevant news for Israelis.

2. **Chrome Extension**  
   A browser extension that runs on the N12 news website, extracts news articles, and uses your Mastra AI agent to transform them into good news.

---

## How It Works

- The Chrome extension scans the N12 website for news articles.
- It sends the news to your Mastra AI agent via API.
- The agent returns positive, funny versions of the news, which the extension then displays on the N12 site.

---

## Getting Started

### 1. Set Up Your Mastra AI Agent

- Create your own account on [Mastra Cloud](https://mastra.cloud/).
- Deploy the provided agent code (`good-news-mastra/src/mastra/agents/good-news-converter.ts`) to your Mastra instance.
- Make sure your agent is running and accessible via an API endpoint.

### 2. Configure the Chrome Extension

- In the extension's `config.js` file, set `MASTRA_API_URL` to your own Mastra agent's API endpoint.

### 3. Add the Extension to Chrome

- Open Chrome and go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked" and select the `good-news-extension` directory

---

## Summary

- The Mastra AI agent does the news conversion.
- The Chrome extension brings the good news to N12.
- You must have your own Mastra Cloud account and agent to use this system.

For more details on agent setup, see the code in `good-news-mastra/src/mastra/agents/good-news-converter.ts`.
