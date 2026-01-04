# LinkLock Browser Extension Setup

## Build the Extension

### Build for Chrome
```bash
yarn build:chrome
```

This creates a `dist-chrome/` directory with the Chrome extension.

### Build for Firefox
```bash
yarn build:firefox
```

This creates a `dist-firefox/` directory with the Firefox extension.

### Build for Both
```bash
yarn build
```

Builds both Chrome and Firefox versions.

## Development Mode

### Chrome Development
```bash
yarn watch:chrome
```

Runs Vite in watch mode for Chrome, rebuilding on file changes.

### Firefox Development
```bash
yarn watch:firefox
```

Runs Vite in watch mode for Firefox, rebuilding on file changes.

## Load the Extension

### Chrome / Edge / Brave

1. Build the extension: `yarn build:chrome`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `dist-chrome` folder
6. The extension should now appear in your toolbar

### Firefox

1. Build the extension: `yarn build:firefox`
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to `dist-firefox` folder
5. Select the `manifest.json` file
6. The extension will be loaded (temporary until browser restart)

**Note:** For permanent Firefox installation, you need to sign the extension through AMO (addons.mozilla.org).

## Testing the Extension

1. Load the extension in your browser (see above)
2. Click the extension icon in the toolbar to open the popup
3. Click "Open Settings" to configure the extension
4. Add a website rule to test locking functionality

## Directory Structure

```
dist-chrome/          # Chrome extension build output
├── manifest.json     # Chrome manifest (V3)
├── popup.html
├── options.html
├── unlock.html
├── background.js
├── icons/
└── assets/

dist-firefox/         # Firefox extension build output
├── manifest.json     # Firefox manifest (V2)
├── popup.html
├── options.html
├── unlock.html
├── background.js
├── icons/
└── assets/
```

## Browser Differences

### Chrome (Manifest V3)
- Uses Service Worker for background script
- Uses `declarativeNetRequest` API for blocking
- More restrictive CSP (Content Security Policy)

### Firefox (Manifest V2)
- Uses persistent background script
- Uses `webRequest` API for blocking
- More permissive CSP

The browser abstraction layer handles these differences automatically.

## Icons

Place your extension icons in `public/icons/`:
- `icon-16.png` (16x16)
- `icon-32.png` (32x32)
- `icon-48.png` (48x48)
- `icon-128.png` (128x128)

See `public/icons/README.md` for more details.

## Troubleshooting

### Extension not loading
- Check the browser console for errors
- Verify all required files are in the dist directory
- Make sure manifest.json is valid

### Background script errors
- Open the extension's background page:
  - Chrome: `chrome://extensions/` → Details → "Inspect views: service worker"
  - Firefox: `about:debugging` → Extension → Inspect

### Permission errors
- Check that all required permissions are in manifest.json
- Some APIs require specific permissions

### Build errors
- Run `yarn install` to ensure all dependencies are installed
- Check Node.js version (requires v16+)
- Clear build cache: `rm -rf dist-chrome dist-firefox node_modules/.vite`

## Next Steps

1. **Implement Core Services**: Add the services from `src/core/` (PasswordService, EncryptionService, StorageService, etc.)
2. **Integrate Background Script**: Connect the background script to ApplicationService
3. **Build UI Components**: Create the full UI for options, popup, and unlock pages
4. **Add Icons**: Design and add extension icons
5. **Test Thoroughly**: Test all features across both browsers
6. **Package for Distribution**: Prepare for Chrome Web Store and Firefox Add-ons
