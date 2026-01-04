# LinkLock Installation Guide

## 🚀 Quick Start

### Step 1: Build the Extension

```bash
# Install dependencies (if not already done)
yarn install

# Build for both browsers
yarn build
```

This creates two directories:
- `dist-chrome/` - Chrome/Edge/Brave extension
- `dist-firefox/` - Firefox extension

### Step 2: Load in Chrome/Edge/Brave

1. Open your browser and navigate to:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
   - **Brave**: `brave://extensions/`

2. Enable **Developer mode** (toggle in top-right corner)

3. Click **"Load unpacked"**

4. Select the `dist-chrome` folder from your LinkLock project

5. The extension should now appear in your toolbar with a blue lock icon

### Step 3: Load in Firefox

1. Open Firefox and navigate to: `about:debugging#/runtime/this-firefox`

2. Click **"Load Temporary Add-on..."**

3. Navigate to the `dist-firefox` folder

4. Select the `manifest.json` file

5. The extension will be loaded (temporary until browser restart)

**Note**: For permanent Firefox installation, you need to sign the extension through [addons.mozilla.org](https://addons.mozilla.org)

## 🎯 First Time Setup

### 1. Set Master Password

When you first open the extension:

1. Click the LinkLock icon in your toolbar
2. Click **"Open Settings"**
3. You'll be prompted to set a master password
4. Enter a strong password and confirm
5. Your master password is hashed and encrypted locally

### 2. Add Your First Rule

1. In the Options page, click **"Add New Rule"**
2. Enter a website pattern (e.g., `twitter.com`)
3. Choose an action:
   - **Lock**: Require password to access
   - **Block**: Completely block access
   - **Redirect**: Redirect to another URL
4. For Lock action:
   - Choose lock mode (Always Ask, Timed Unlock, or Session Unlock)
   - Optionally set a custom password for this site
5. Click **"Create Rule"**

### 3. Test the Extension

1. Navigate to a website you've locked (e.g., `https://twitter.com`)
2. You should be redirected to the unlock page
3. Enter your password (master password or custom password)
4. You'll be redirected to the original site
5. Depending on your lock mode, the site may remain unlocked for the specified duration

## 🔧 Development Workflow

### Watch Mode (Auto-rebuild on changes)

```bash
# Chrome
yarn watch:chrome

# Firefox
yarn watch:firefox
```

After making changes, click the reload button in your browser's extensions page.

### Building for Distribution

```bash
# Production build
yarn build

# Individual browsers
yarn build:chrome
yarn build:firefox
```

##  Testing Checklist

- [ ] Extension loads without errors
- [ ] Icons appear correctly
- [ ] Popup opens and shows current site status
- [ ] Options page opens successfully
- [ ] Can set master password
- [ ] Can create lock rules
- [ ] Locked sites redirect to unlock page
- [ ] Password verification works
- [ ] Unlock sessions persist correctly
- [ ] Lock/unlock toggle in popup works

## 🐛 Troubleshooting

### Extension doesn't load
- Check browser console for errors (`F12` → Console)
- Verify all files are in dist directory
- Check manifest.json is valid JSON
- Try rebuilding: `rm -rf dist-* && yarn build`

### Background script errors
- **Chrome**: Go to `chrome://extensions/` → Details → "Inspect views: service worker"
- **Firefox**: Go to `about:debugging` → Extension → Inspect
- Check background.js for console errors

### Icons not showing
- Verify `public/icons/` contains all 4 icon sizes
- Run `node scripts/generate-icons.cjs` to regenerate icons
- Rebuild the extension

### Storage not persisting
- Chrome: Check `chrome://extensions/` → Details → "Site access" is set correctly
- Firefox: Check storage permissions in manifest
- Clear browser extension storage and start fresh

### CORS or Permission Errors
- Verify `host_permissions` in manifest.json
- Check that all required permissions are declared
- Some URLs (chrome://, about:/) cannot be controlled by extensions

## 📱 Browser-Specific Notes

### Chrome/Edge/Brave (Manifest V3)
- Uses Service Worker for background script
- Has stricter Content Security Policy
- Requires `declarativeNetRequest` for blocking

### Firefox (Manifest V2)
- Uses persistent background script
- More permissive CSP
- Temporary add-ons unload on browser restart

## 🔒 Security Notes

- Master password is hashed with SHA-256
- All sensitive data is AES-256-GCM encrypted
- Data is stored locally in browser storage
- No network requests, completely offline
- No analytics or tracking

## 🆘 Getting Help

If you encounter issues:

1. Check this troubleshooting guide first
2. Look at browser console for errors
3. Try rebuilding the extension from scratch
4. Open an issue on GitHub with:
   - Browser and version
   - Error messages
   - Steps to reproduce

## 🎉 You're Ready!

Your LinkLock extension is now installed and ready to help you maintain focus and privacy!

Start by locking distracting websites and customizing your protection rules in the Options page.
