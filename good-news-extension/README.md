# Good News Chrome Extension

This Chrome extension brings positivity to the N12 news website by converting bad news into good and funny news, using your own Mastra AI agent (currently working with @amitbrickman's one).

---

## What It Does

- Works only on [N12.co.il](https://www.n12.co.il)
- Scans the news articles on the page
- Sends them to your Mastra AI agent for conversion
- Replaces the original news with positive, funny versions

---

## How to Use

1. **(Optional) Configure the Extension**

   - In the `config.js` file, set `MASTRA_API_URL` to your Mastra agent's API endpoint (for more details about Mastra cloud read the main README file)

2. **Add to Chrome**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `good-news-extension` folder

---

## Usage

- Go to [N12.co.il](https://www.n12.co.il)
- Click the extension icon in your Chrome toolbar
- Click "Give Me Good News"
- The news on the page will be replaced with positive, funny versions after a few seconds

---

## Note

- The extension only works on N12.
- For agent setup, see the main project README.

## Features

- Converts bad news to positive, humorous news
- Specifically targets N12 news website (n12.co.il)
- Replaces both titles and descriptions on the N12 page
- Popup provides a clean, modern UI with clear loading and error states
- Secure: no dangerous JS patterns, no data is stored or tracked
