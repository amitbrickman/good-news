# Good News Chrome Extension

A Chrome extension that converts bad news (war, death, crime) into good and funny news tailored for Israeli people using the Mastra AI framework.

## Features

- 🌞 Converts bad news to positive, humorous news
- 🎯 Specifically targets N12 news website
- 🔄 Replaces both titles and descriptions on the page
- ⚙️ Configurable via environment variables

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

## Environment Variables

| Variable                   | Description                             | Default                                                                                  | Required |
| -------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| `MASTRA_API_URL`           | Your Mastra API endpoint                | `https://sparse-hundreds-sweden.mastra.cloud/api/agents/goodNewsConverterAgent/generate` | Yes      |
| (empty)                    | No                                      |
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

## Usage

1. Navigate to the target website (default: n12.co.il)
2. Click the extension icon in your Chrome toolbar
3. Click "Scan for News" to find news articles on the page
4. The extension will send the news to your Mastra API
5. Converted good news will replace the original bad news on the page

## Development

### Project Structure

```
good-news-extension/
├── .env                    # Environment variables (create from env.example)
├── env.example            # Example environment configuration
├── env.d.ts               # TypeScript definitions for environment variables
├── build.js               # Build script that injects environment variables
├── package.json           # Node.js dependencies and scripts
├── manifest.json          # Chrome extension manifest
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic and API calls
├── content.js             # Content script that runs on web pages
├── background.js          # Background script for extension lifecycle
└── README.md              # This file
```

### Available Scripts

- `npm run build` - Build the extension with current environment variables
- `npm run dev` - Build and show instructions for loading
- `npm run clean` - Remove the .env file

### Customizing for Different Websites

To adapt this extension for other news websites:

1. Update the environment variables:

   ```env
   TARGET_TITLE_SELECTOR=.your-title-class
   TARGET_SUBTITLE_SELECTOR=.your-description-class
   ```

2. Rebuild the extension:

   ```bash
   npm run build
   ```

3. Reload the extension in Chrome

### API Response Format

The extension expects your Mastra agent to return a JSON response in this format:

```json
{
  "goodNewsList": [
    {
      "title": "Converted good news title",
      "description": "Converted good news description",
      "originalBadNews": {
        "title": "Original bad news title",
        "description": "Original bad news description"
      }
    }
  ]
}
```

## Troubleshooting

### Extension Not Working

1. Check the browser console (F12) for error messages
2. Verify your Mastra API is running and accessible
3. Ensure the target website is correctly configured
4. Check that the CSS selectors match the website's structure

### API Errors

1. Verify your `MASTRA_API_URL` is correct
2. Ensure your Mastra agent is properly deployed and responding

### Build Issues

1. Make sure you have Node.js installed
2. Run `npm install` to install dependencies
3. Check that your `.env` file exists and is properly formatted
4. Verify all environment variables are set correctly

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

1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Verify your Mastra setup is working correctly
4. Open an issue on GitHub with detailed error information
