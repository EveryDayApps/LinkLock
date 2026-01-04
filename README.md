# 🔒 LinkLock

A privacy-first, cross-browser extension that password protects websites with fine-grained control, profiles, and timed access.

## Features

- **Password Protection**: Lock websites behind master password or custom passwords
- **Flexible Lock Modes**: Always ask, timed unlock, or session unlock
- **Profiles**: Create multiple profiles (Work, Focus, Kids, Personal) with independent rules
- **Snooze**: Temporarily bypass locks for set durations
- **Privacy-First**: All data stored locally, fully encrypted
- **Cross-Browser**: Works on Chrome, Edge, Brave, and Firefox

## Browser Support

- ✅ Google Chrome (Manifest V3)
- ✅ Mozilla Firefox (Manifest V2)
- ✅ Microsoft Edge (Manifest V3)
- ✅ Brave (Manifest V3)

## Quick Start

### Installation for Development

1. **Install dependencies**:
   ```bash
   yarn install
   ```

2. **Build for your browser**:
   ```bash
   # For Chrome/Edge/Brave
   yarn build:chrome

   # For Firefox
   yarn build:firefox

   # Or build both
   yarn build
   ```

3. **Load the extension**:

   **Chrome/Edge/Brave:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist-chrome` folder

   **Firefox:**
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select `manifest.json` from the `dist-firefox` folder

## Development

### Project Structure

```
LinkLock/
├── src/
│   ├── background/          # Background service worker
│   │   └── index.ts
│   ├── core/                # Core business logic
│   │   ├── browser/         # Browser abstraction layer
│   │   ├── messages/        # Message passing types
│   │   ├── services/        # Password, encryption, storage
│   │   └── managers/        # Rule, profile, session management
│   ├── ui/                  # React UI components (to be built)
│   ├── popup.tsx            # Extension popup
│   ├── options.tsx          # Settings page
│   └── unlock.tsx           # Unlock page
├── public/
│   ├── manifest.chrome.json # Chrome manifest (V3)
│   ├── manifest.firefox.json# Firefox manifest (V2)
│   └── icons/               # Extension icons
├── dist-chrome/             # Chrome build output
└── dist-firefox/            # Firefox build output
```

### Available Scripts

```bash
# Development
yarn dev                    # Dev server (web mode)
yarn dev:chrome            # Dev server for Chrome
yarn dev:firefox           # Dev server for Firefox

# Building
yarn build                 # Build for both browsers
yarn build:chrome         # Build for Chrome
yarn build:firefox        # Build for Firefox

# Watch mode (auto-rebuild on changes)
yarn watch:chrome         # Watch mode for Chrome
yarn watch:firefox        # Watch mode for Firefox

# Other
yarn lint                 # Run ESLint
```

### Architecture

LinkLock uses a **browser-agnostic architecture**:

1. **Browser Abstraction Layer** ([src/core/browser/](src/core/browser/))
   - Unified API for Chrome and Firefox
   - Automatic browser detection
   - No browser-specific code in business logic

2. **Message Passing** ([src/core/messages/](src/core/messages/))
   - Type-safe communication between UI and background
   - Async request/response pattern

3. **Background Script** ([src/background/index.ts](src/background/index.ts))
   - Navigation interception
   - Rule evaluation
   - Session management

4. **React UI**
   - Popup: Quick status and controls
   - Options: Full settings management
   - Unlock: Password entry page

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.

## Security

- **Password Hashing**: SHA-256 for all passwords
- **Encryption**: AES-GCM 256-bit for all sensitive data
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Local Storage**: Everything stored locally, no cloud sync
- **Web Crypto API**: Uses browser's built-in cryptography

## Roadmap

### Phase 1: Core Extension ✅ COMPLETE
- [x] Browser abstraction layer
- [x] Manifest files (Chrome V3, Firefox V2)
- [x] Background service worker
- [x] Message passing system
- [x] Basic UI pages (popup, options, unlock)
- [x] Build system setup

### Phase 2: Core Features ✅ COMPLETE
- [x] Navigation interception (actually blocks sites!)
- [x] Password verification (SHA-256)
- [x] Lock/Block/Redirect actions
- [x] Timed/Session/Always lock modes
- [x] Custom passwords per site
- [x] Snooze functionality
- [x] Wildcard pattern matching
- [x] Rule creation and management

### Phase 3: UI Components ✅ COMPLETE
- [x] Full options page with master password setup
- [x] Add/Edit rule modal
- [x] Real-time popup status
- [x] Enhanced unlock page
- [x] Block page
- [x] Visual status indicators

### Phase 4: Advanced Features (Optional Enhancements)
- [ ] Profile management (Work, Focus, etc.)
- [ ] Import/Export functionality
- [ ] Activity logging
- [ ] Usage statistics
- [ ] Time-based scheduling
- [ ] Dark mode

### Phase 5: Polish & Distribution
- [x] Extension icons and branding
- [x] Comprehensive testing
- [ ] Performance optimization
- [ ] Chrome Web Store submission
- [ ] Firefox Add-ons submission

## Documentation

- [Extension Setup Guide](EXTENSION_SETUP.md) - Detailed build and installation instructions
- [Architecture Documentation](ARCHITECTURE.md) - System design and technical details
- [Feature Specification](plan/core.md) - Complete feature requirements

## Contributing

This is currently a personal project. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Add your license here]

## Privacy Policy

LinkLock is privacy-first:
- **No tracking**: Zero analytics or telemetry
- **No cloud sync**: All data stored locally on your device
- **No network requests**: Extension works 100% offline
- **Open source**: Full transparency of what the code does

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Made with ❤️ for privacy-conscious users**
