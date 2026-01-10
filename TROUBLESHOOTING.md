# Troubleshooting Guide

## Module Export Errors

### "does not provide an export named 'EncryptedData'"

This is a Vite dev server caching issue. To fix:

1. **Stop the dev server** (Ctrl+C)
2. **Clear Vite cache:**
   ```bash
   rm -rf node_modules/.vite
   ```
3. **Restart dev server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Alternative: Hard Refresh

If the error persists:
1. In your browser, do a hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. Or clear browser cache for localhost

## TypeScript Errors

### Import Resolution Issues

If you see TypeScript errors about imports:

1. **Restart TypeScript server** in VS Code:
   - `Cmd+Shift+P` → "TypeScript: Restart TS Server"

2. **Check tsconfig.json** has correct paths:
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

## Build Issues

### Extension Build Errors

If `yarn build:chrome` or `yarn build:firefox` fail:

1. **Clean build directories:**
   ```bash
   rm -rf dist_chrome dist_firefox dist
   ```

2. **Rebuild:**
   ```bash
   yarn build:extensions
   ```

## UI Components Not Rendering

### Missing UI Components

If components like Dialog, Input, or Card don't render:

1. **Check all files exist:**
   ```bash
   ls src/components/ui/
   # Should show: button.tsx, card.tsx, dialog.tsx, input.tsx, sheet.tsx
   ```

2. **Verify imports** use correct paths:
   ```typescript
   import { Input } from "../ui/input";
   import { Card } from "../ui/card";
   import { Dialog } from "../ui/dialog";
   ```

### CSS/Styling Issues

If components appear unstyled:

1. **Check Tailwind is loaded** - verify `index.css` imports Tailwind
2. **Verify dark mode classes** are applied to parent elements
3. **Check browser console** for CSS loading errors

## Profile Management Issues

### Profiles Not Persisting

If profiles don't persist after page reload:

1. **Check browser storage:**
   - Open DevTools → Application → Storage → Local Storage
   - Look for `linklock_data_v1` key

2. **Verify encryption works:**
   - Open console and run:
   ```javascript
   import { demos } from './src/lib/demo.ts'
   demos.encryptionStorage()
   ```

### Cannot Switch/Delete Profiles

If profile operations fail:

1. **Check console for errors**
2. **Verify master password hash** is set correctly
3. **Try reinitializing ProfileManager:**
   ```javascript
   const manager = new ProfileManager();
   await manager.initialize("your-password-hash");
   ```

## Common Fixes

### Nuclear Option: Full Reset

If all else fails:

```bash
# Stop dev server
# Clear all caches and builds
rm -rf node_modules/.vite dist dist_chrome dist_firefox

# Clear browser storage (in DevTools → Application → Clear Storage)

# Reinstall dependencies
yarn install

# Restart dev server
yarn dev
```

## Getting Help

If issues persist:

1. Check browser console for errors
2. Check terminal for build errors
3. Verify all files from the implementation exist
4. Create an issue with:
   - Error message
   - Browser version
   - Steps to reproduce
