# Ed Reply Time Splitter

A Chrome extension for identifying students who responded to an Ed discussion before or after a specified deadline.

## Features

- Reads responder names from the currently open Ed thread
- Splits responders based on a chosen date and time
- Students who responded before the deadline are not counted again afterward
- Copies either list with one click
- All processing happens locally in the browser

## Installation

Install from the Chrome Web Store (currently unavailable)

### Manual Installation from GitHub

This extension can also be added directly to your Chrome browser through the following step:

1. Download the repository.
   - Click **Code** on the GitHub repository page.
   - Choose **Download ZIP**.
   - Extract the ZIP file to a permanent folder on your computer.

2. Open Chrome and go to:
   ```text
   chrome://extensions
   ```

3. Turn on **Developer mode** using the toggle in the top-right corner.

4. Click **Load unpacked**.

5. Select the folder that contains the extension files, including:
   ```text
   manifest.json
   popup.html
   popup.css
   popup.js
   ```

6. The extension should now appear in your Chrome extensions list.

7. Open an Ed discussion thread and click the extension icon to use it.

#### Updating the Extension Manually

If you download a newer version from GitHub:

1. Replace the old extension files with the updated files.
2. Go back to:
   ```text
   chrome://extensions
   ```
3. Find **Ed Reply Time Splitter**.
4. Click the **Reload** button on the extension card.

If you cloned the repository with Git instead, you can update it with:

```bash
git pull
```

Then reload the extension from `chrome://extensions`.

#### Notes

- The extension must remain in the same folder after it is loaded into Chrome.
- If the folder is moved or deleted, Chrome may no longer be able to load the extension correctly.

## Usage

1. Open an Ed discussion thread.
2. Click the extension icon.
3. Enter the cutoff date and time.
4. Click "Analyze Thread."
5. Copy either list.

## Privacy

The extension processes information already visible to the signed-in user on the current Ed page.
It does not send responder names to an external server.

## Disclaimer
This software was created with the assistance of an LLM. The code may contain errors, inaccuracies, or unintended behavior. The author assumes no responsibility or liability for any use or misuse of this software.
