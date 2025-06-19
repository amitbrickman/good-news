# Good News Chrome Extension

A Chrome extension that converts bad news into good and funny news tailored for Israeli people using AI.

## Features

- Converts bad news to positive, humorous news
- Specifically targets N12 news website (n12.co.il)
- Replaces both titles and descriptions on the N12 page
- Popup provides a clean, modern UI with clear loading and error states
- Secure: no dangerous JS patterns, no data is stored or tracked

## Prerequisites

- Node.js (version 14 or higher)
- A Mastra instance with the `goodNewsConverterAgent` deployed
- Chrome browser

## Installation & Setup

### 1. Clone or Fork the Repository

```bash
git clone <your-repo-url>
cd good-news-extension
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and configure it with your settings:

```bash
cp env.example .env
```

Edit the `.env` file with your configuration:

```env
# Mastra API Configuration
MASTRA_API_URL=https://your-mastra-instance.mastra.cloud/api/agents/goodNewsConverterAgent/generate

# Target Website Configuration (optional - defaults to n12.co.il)
# TARGET_TITLE_SELECTOR=[data-type="title"]
# TARGET_SUBTITLE_SELECTOR=[data-type="subtitle"]

# API Request Configuration (optional)
# MAX_NEWS_ITEMS=10
# MAX_DESCRIPTION_LENGTH=200
```

### 4. Build the Extension

```bash
npm run build
```

This will:

- Read your environment variables from `.env`
- Inject them into the extension files
- Update the manifest.json with your extension name and version
- Create the final extension files ready for loading

### 5. Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `good-news-extension` directory
5. The extension should now appear in your extensions list

## Usage

1. Navigate to the target website (n12.co.il)
2. Click the extension icon in your Chrome toolbar
3. Click "Give Me Good News" in the popup
4. The extension will scan the N12 page and send the news to your Mastra API
5. Converted good news will replace the original bad news on the N12 page

### Popup UI States

- **Initial:** Shows the logo, a "Give Me Good News" button, and a disclaimer
- **Loading:** Button is disabled and shows "Loading..."
- **Success:** Button and disclaimer disappear, background turns light pink, and a success message is shown
- **Error:** If not on N12 or if any error occurs, the popup shows a dark background and a clear error message

## Privacy & Security

- The extension does **not** store, track, or transmit any user data except the news content sent to your configured Mastra API
- No dangerous JavaScript patterns (eval, innerHTML, etc.) are used
- All DOM updates use safe methods (textContent)
- All external links use `rel="noopener noreferrer"`
- Minimal permissions are requested in the manifest

## Environment Variables

| Variable                   | Description                             | Default                                                                                  | Required |
| -------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| `MASTRA_API_URL`           | Your Mastra API endpoint                | `https://sparse-hundreds-sweden.mastra.cloud/api/agents/goodNewsConverterAgent/generate` | Yes      |
| `TARGET_TITLE_SELECTOR`    | CSS selector for news titles            | `[data-type="title"]`                                                                    | No       |
| `TARGET_SUBTITLE_SELECTOR` | CSS selector for news descriptions      | `[data-type="subtitle"]`                                                                 | No       |
| `MAX_NEWS_ITEMS`           | Maximum number of news items to process | `10`                                                                                     | No       |
| `MAX_DESCRIPTION_LENGTH`   | Maximum length for descriptions         | `200`                                                                                    | No       |

## Extension Configuration

The following values are hardcoded in the extension and don't need to be set as environment variables:

| Configuration       | Value                 | Description                   |
| ------------------- | --------------------- | ----------------------------- |
| `EXTENSION_NAME`    | `Good News Converter` | Name displayed in Chrome      |
| `EXTENSION_VERSION` | `1.0.0`               | Extension version             |
| `TARGET_WEBSITE`    | `n12.co.il`           | Website where extension works |

## Troubleshooting

- If the extension does not work, check the popup for a clear error message
- If you see "This extension only works on N12.co.il", make sure you are on the correct site
- If you see "Oops! something happened", try refreshing the page and opening the extension again
- Check the browser console (F12) for error messages
- Verify your Mastra API is running and accessible
- Ensure the target website is correctly configured
- Check that the CSS selectors match the website's structure

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

If you encounter issues:

- Check the troubleshooting section above
- Review the browser console for error messages
- Verify your Mastra setup is working correctly
- Open an issue on GitHub with detailed error information
