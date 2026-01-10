# Profile Management - Quick Start Guide

## Setup & Run

### 1. Clear Cache & Restart Dev Server

The module was just created, so clear the Vite cache:

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Start dev server
yarn dev
```

### 2. Open the Application

1. Navigate to `http://localhost:5173` (or your dev server URL)
2. Click the drawer/menu button to open the side panel
3. Click the "Profiles" tab

## Using Profile Management

### Create a Profile

1. Click **"+ New Profile"** button
2. Enter a name (e.g., "Work", "Focus", "Personal")
3. Click **"Create Profile"** or press Enter
4. Your new profile appears in the list

### Switch Profiles

1. Find an inactive profile in the list
2. Click the **"Switch"** button
3. The profile becomes active (indicated by indigo border and dot)
4. Previous active profile becomes inactive

### Edit a Profile

1. Click **"Edit"** on any profile
2. Change the name
3. Click **"Update Profile"** or press Enter

### Delete a Profile

1. Click **"Delete"** on an inactive profile
2. Confirm the deletion in the dialog
3. Profile is permanently removed

**Note:** Cannot delete the active profile or the last remaining profile.

## Features Overview

### What's Working

✅ **Profile CRUD Operations**
- Create unlimited profiles
- Edit profile names
- Switch between profiles
- Delete profiles (with protection)

✅ **Encrypted Storage**
- All data encrypted with AES-GCM
- Secure key derivation (PBKDF2)
- Works in both Chrome extension and browser

✅ **User Interface**
- Clean, dark mode design
- Tab navigation (Rules, Profiles, Import/Export, Settings, About)
- Modal dialogs for actions
- Real-time updates
- Loading states and error handling

✅ **Validation**
- Profile name required
- Unique profile names
- Cannot delete active profile
- Cannot delete only profile

### What's Coming Next

🔜 **Phase 1: Master Password**
- Password setup screen
- Password verification
- Failed attempt tracking
- Session management

🔜 **Phase 2: Rules Integration**
- Link rules per profile
- Rule management UI
- Active rule counts
- Rule copying between profiles

🔜 **Phase 3: Import/Export**
- Backup profiles and rules
- Restore from backup
- Share configurations

## File Structure

```
src/
├── models/
│   └── types.ts                      # Profile, Rule, Storage types
├── lib/
│   ├── encryption.ts                 # AES-GCM encryption
│   ├── storage.ts                    # Encrypted storage service
│   ├── profileManager.ts             # Profile operations
│   └── demo.ts                       # Demo scripts
├── components/
│   ├── ui/
│   │   ├── button.tsx               # Button component
│   │   ├── input.tsx                # Input component
│   │   ├── card.tsx                 # Card component
│   │   └── dialog.tsx               # Modal dialog
│   ├── profiles/
│   │   ├── ProfilesTab.tsx          # Main profiles UI
│   │   ├── CreateProfileModal.tsx   # Create modal
│   │   └── EditProfileModal.tsx     # Edit modal
│   └── core/
│       └── DrawerContent.tsx        # Main drawer with tabs
```

## Testing the System

### Manual Testing

1. **Create profiles:**
   - Create "Work", "Personal", "Focus" profiles
   - Verify they appear in the list

2. **Switch profiles:**
   - Switch from Default to Work
   - Verify active indicator moves

3. **Edit profiles:**
   - Edit "Focus" to "Deep Focus"
   - Verify name updates

4. **Delete profiles:**
   - Delete "Personal" profile
   - Try to delete active profile (should fail)

5. **Validation:**
   - Try empty name (should fail)
   - Try duplicate name (should fail)

### Browser Console Testing

Run demo scripts in console:

```javascript
// Import demos
import { demos } from '/src/lib/demo.ts'

// Test profile management
await demos.profileManagement()

// Test encryption
await demos.encryptionStorage()

// Test full workflow
await demos.fullWorkflow()
```

## Keyboard Shortcuts

- **Enter** in modal inputs → Submit/Create/Update
- **Escape** → Close modal
- **Tab** navigation → Navigate between tabs

## Storage Details

### Where Data is Stored

- **Development:** `localStorage.linklock_data_v1`
- **Chrome Extension:** `chrome.storage.local.linklock_data_v1`
- **Firefox Extension:** Browser storage API

### Storage Format

```json
{
  "linklock_data_v1": {
    "encrypted": "base64-encrypted-data",
    "iv": "base64-initialization-vector"
  }
}
```

### What's Encrypted

Everything inside `StorageData`:
- All profiles (id, name, timestamps)
- All rules (when implemented)
- Security config (when implemented)

### Viewing Storage

**Chrome/Firefox DevTools:**
1. F12 → Application/Storage tab
2. Local Storage → your domain
3. Look for `linklock_data_v1`

**Note:** Data is encrypted, so it appears as gibberish.

## Troubleshooting

### "Module not found" errors
→ Clear Vite cache: `rm -rf node_modules/.vite`

### Profiles not persisting
→ Check browser console for storage errors

### UI components not rendering
→ Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)

### TypeScript errors
→ Restart TS server in VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"

For more help, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## Next Steps

After verifying profile management works:

1. **Implement Master Password UI**
   - Setup screen on first launch
   - Password verification before sensitive ops
   - Password change flow

2. **Add Rule Management**
   - Create RuleManager class
   - Link rules to profiles
   - UI for managing rules

3. **Connect to Browser Extension**
   - Integrate with content scripts
   - Apply rules based on active profile
   - Handle lock/block/redirect actions

## Documentation

- [PROFILE_MANAGEMENT.md](PROFILE_MANAGEMENT.md) - Complete implementation guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Fix common issues
- This file - Quick start guide

---

**Ready to go!** Start the dev server and open the Profiles tab. 🚀
