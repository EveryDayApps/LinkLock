# Debug Mode for Development

## Overview

LinkLock supports a debug mode that makes development and testing easier by disabling encryption and using descriptive field/table names in IndexedDB.

## How It Works

### Production Mode (Default for builds)

- ✅ Full encryption enabled
- ✅ Obfuscated table names: `t1`, `t2`, `t3`
- ✅ Obfuscated field names: `k`, `d`, `v`, `p`
- ✅ All data encrypted with AES-GCM
- ✅ All IDs encrypted for lookups

### Debug Mode (Default for dev)

- 🔍 Encryption disabled - plain text storage
- 🔍 Descriptive table names: `profiles`, `rules`, `masterPassword`
- 🔍 Descriptive field names: `id`, `encryptedData`, `iv`, `profileIds`
- 🔍 All data visible in IndexedDB inspector
- 🔍 Console logging enabled

## Usage

### Development Server

**Standard (encrypted):**

```bash
npm run dev
```

**Debug mode (plain text):**

```bash
npm run dev:debug
# or
VITE_DEBUG_MODE=true npm run dev
```

### Building Extensions

**Production build (encrypted):**

```bash
npm run build:chrome
npm run build:firefox
npm run build:extensions  # both
```

**Debug build (plain text):**

```bash
npm run build:chrome:debug
npm run build:firefox:debug
npm run build:extensions:debug  # both
```

## Environment Variables

Create a `.env.local` file to override settings:

```env
# Enable debug mode
VITE_DEBUG_MODE=true

# Disable debug mode (production)
VITE_DEBUG_MODE=false
```

## Inspecting Data

### With Debug Mode Enabled

1. Open browser DevTools
2. Go to Application/Storage → IndexedDB → LinkLockDB
3. You'll see:
   - Tables: `profiles`, `rules`, `masterPassword`
   - Fields: `id`, `encryptedData`, `iv`, `profileIds`
   - Values: Plain JSON text (not encrypted)

Example record in debug mode:

```javascript
{
  id: "profile-123-abc-def",
  encryptedData: '{"id":"profile-123-abc-def","name":"Default","isActive":true,...}',
  iv: "debug-mode-no-iv",
  type: "profile"
}
```

### With Debug Mode Disabled (Production)

1. Open browser DevTools
2. Go to Application/Storage → IndexedDB → LinkLockDB
3. You'll see:
   - Tables: `t1`, `t2`, `t3`
   - Fields: `k`, `d`, `v`, `p`
   - Values: Encrypted base64 strings

Example record in production mode:

```javascript
{
  k: "xY9Zm2Kl3Np...",
  d: "qR7Wt4Yx8Zv...",
  v: "aB5Cd9Ef2Gh...",
  t: "profile"
}
```

## Configuration Details

The debug mode is controlled by:

1. **Environment Variable:** `VITE_DEBUG_MODE`
2. **Config File:** `src/services/config.ts`
3. **Default Behavior:** Enabled in dev (`import.meta.env.DEV`), disabled in production

## Important Notes

⚠️ **NEVER deploy debug mode to production**

- Debug mode stores all data in plain text
- Anyone with access to the browser can read all data
- Use only for development and testing

✅ **Always verify production builds:**

```bash
# Build for production
npm run build:chrome

# Check that VITE_DEBUG_MODE is not set
grep VITE_DEBUG_MODE dist_chrome/assets/*.js
# Should return nothing
```

## Console Logging

When debug mode is enabled, you'll see helpful console messages:

```
[DEBUG] Database initialized with: {
  useEncryption: false,
  useObfuscation: false,
  tableProfiles: "profiles",
  tableRules: "rules",
  fieldKey: "id",
  fieldData: "encryptedData"
}

[DEBUG] Encryption bypassed - storing plain text
[DEBUG] Decryption bypassed - reading plain text
```

## Troubleshooting

**Q: Data not visible in debug mode?**

- Check that `VITE_DEBUG_MODE=true` is set
- Clear IndexedDB and reload
- Check console for debug messages

**Q: Build contains plain text data?**

- Make sure you're using standard build commands (not `:debug` variants)
- Verify `.env.production` has `VITE_DEBUG_MODE=false`
- Check built files don't contain debug logs

**Q: How to switch between modes?**

- Delete IndexedDB database: DevTools → Application → IndexedDB → Right-click → Delete
- Reload the extension/page
- Data will be stored in the new format
