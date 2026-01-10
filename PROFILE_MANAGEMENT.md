# Profile Management Implementation

This document describes the profile management system for LinkLock, including encrypted local storage and UI components.

## Overview

The profile management system allows users to:
- Create multiple profiles (Work, Focus, Kids, Personal, etc.)
- Edit profile names
- Switch between profiles
- Delete profiles (except active profile)
- Store all data encrypted in local storage

## Architecture

### 1. Data Models ([src/models/types.ts](src/models/types.ts))

```typescript
interface Profile {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface StorageData {
  profiles: Profile[];
  rules: LinkRule[];
  securityConfig?: {
    masterPasswordHash: string;
    // ... other security settings
  };
}
```

### 2. Encryption Layer ([src/lib/encryption.ts](src/lib/encryption.ts))

**EncryptionService** handles AES-GCM encryption/decryption:
- Uses Web Crypto API
- PBKDF2 key derivation with 100,000 iterations
- AES-GCM with 256-bit keys
- Random IV generation for each encryption

**Methods:**
- `encrypt(data, masterPasswordHash)` - Encrypts string data
- `decrypt(encryptedData, iv, masterPasswordHash)` - Decrypts data

### 3. Storage Layer ([src/lib/storage.ts](src/lib/storage.ts))

**StorageService** manages encrypted local storage:
- Supports both Chrome extension storage and localStorage fallback
- Automatic encryption/decryption
- Type-safe data loading

**Methods:**
- `save<T>(key, data, masterPasswordHash)` - Save encrypted data
- `load<T>(key, masterPasswordHash)` - Load and decrypt data
- `saveStorageData(data, masterPasswordHash)` - Save all app data
- `loadStorageData(masterPasswordHash)` - Load all app data
- `delete(key)` - Delete specific key
- `clear()` - Clear all storage

### 4. Profile Manager ([src/lib/profileManager.ts](src/lib/profileManager.ts))

**ProfileManager** handles all profile operations:

**Initialization:**
```typescript
const manager = new ProfileManager();
await manager.initialize(masterPasswordHash);
```

**CRUD Operations:**
- `createProfile(name)` - Create new profile
- `updateProfile(profileId, name)` - Update profile name
- `switchProfile(profileId)` - Switch active profile
- `deleteProfile(profileId)` - Delete profile (cannot delete active)
- `getActiveProfile()` - Get current active profile
- `getAllProfiles()` - Get all profiles

**Features:**
- Automatic default profile creation on first run
- Profile name uniqueness validation
- Active profile tracking
- Automatic persistence to encrypted storage

## UI Components

### 1. ProfilesTab ([src/components/profiles/ProfilesTab.tsx](src/components/profiles/ProfilesTab.tsx))

Main profile management interface:
- Lists all profiles with active indicator
- Shows rule count for each profile (0 for now, will be dynamic later)
- Switch, Edit, Delete buttons for each profile
- Create new profile button
- Delete confirmation dialog

**Features:**
- Active profile highlighted with indigo border
- Cannot delete active profile
- Visual active indicator (colored dot)
- Responsive card layout

### 2. CreateProfileModal ([src/components/profiles/CreateProfileModal.tsx](src/components/profiles/CreateProfileModal.tsx))

Modal for creating new profiles:
- Profile name input
- Validation (empty name check)
- Error handling
- Enter key to submit
- Loading state during creation

### 3. EditProfileModal ([src/components/profiles/EditProfileModal.tsx](src/components/profiles/EditProfileModal.tsx))

Modal for editing profile names:
- Pre-filled with current name
- Same validation as create
- Error handling
- Enter key to submit
- Loading state during update

### 4. UI Component Library

Created supporting components:
- **Input** ([src/components/ui/input.tsx](src/components/ui/input.tsx)) - Text input with label and error
- **Card** ([src/components/ui/card.tsx](src/components/ui/card.tsx)) - Card container with header/content/footer
- **Dialog** ([src/components/ui/dialog.tsx](src/components/ui/dialog.tsx)) - Modal dialog with backdrop
- **Button** (updated [src/components/ui/button.tsx](src/components/ui/button.tsx)) - Added 'danger' variant

## Integration

### DrawerContent ([src/components/core/DrawerContent.tsx](src/components/core/DrawerContent.tsx))

Updated to include:
- Tab navigation (Rules, Profiles, Import/Export, Settings, About)
- Active tab highlighting
- ProfilesTab integration
- Wider drawer (600-700px) for better UX

## Security

### Encryption Details

1. **Password Hashing:**
   - Master password is hashed using SHA-256
   - Hash is used as key material for encryption

2. **Key Derivation:**
   - PBKDF2 with 100,000 iterations
   - SHA-256 hash function
   - Static salt: "linklock-salt-v1"

3. **Data Encryption:**
   - AES-GCM with 256-bit keys
   - Random 12-byte IV for each encryption
   - Both encrypted data and IV stored

4. **Storage Format:**
   ```json
   {
     "linklock_data_v1": {
       "encrypted": "base64-encoded-ciphertext",
       "iv": "base64-encoded-iv"
     }
   }
   ```

### Security Considerations

⚠️ **Current Limitations:**
- Using a temporary password hash (`"temp-password-hash"`) for demo
- Static salt (should be per-user in production)
- No master password UI yet (coming in next phase)

🔒 **Production Requirements:**
1. Implement master password setup on first launch
2. Require master password for accessing profiles/settings
3. Generate unique salt per user
4. Implement password strength validation
5. Add password change functionality
6. Implement cooldown on failed attempts

## Usage

### Creating a Profile

```typescript
const manager = new ProfileManager();
await manager.initialize(masterPasswordHash);

const result = await manager.createProfile("Work");
if (result.success) {
  console.log("Profile created:", result.profileId);
} else {
  console.error("Error:", result.error);
}
```

### Switching Profiles

```typescript
const result = await manager.switchProfile(profileId);
if (result.success) {
  // Profile switched successfully
  // All unlock sessions should be cleared
} else {
  console.error("Error:", result.error);
}
```

### Deleting a Profile

```typescript
const result = await manager.deleteProfile(profileId);
if (result.success) {
  // Profile deleted
  // Associated rules should also be deleted
} else {
  console.error("Error:", result.error);
  // Common errors:
  // - "Cannot delete active profile"
  // - "Cannot delete the only profile"
}
```

## File Structure

```
src/
├── models/
│   └── types.ts                           # Domain types
├── lib/
│   ├── encryption.ts                      # Encryption service
│   ├── storage.ts                         # Storage service
│   └── profileManager.ts                  # Profile management
├── components/
│   ├── ui/
│   │   ├── button.tsx                     # Button component
│   │   ├── input.tsx                      # Input component
│   │   ├── card.tsx                       # Card component
│   │   └── dialog.tsx                     # Dialog component
│   ├── profiles/
│   │   ├── ProfilesTab.tsx                # Main profiles UI
│   │   ├── CreateProfileModal.tsx         # Create profile modal
│   │   └── EditProfileModal.tsx           # Edit profile modal
│   └── core/
│       └── DrawerContent.tsx              # Main drawer with tabs
```

## Next Steps

### Phase 1: Master Password
- [ ] Create master password setup screen
- [ ] Implement password verification
- [ ] Add password change functionality
- [ ] Add failed attempt tracking
- [ ] Implement cooldown on failures

### Phase 2: Rules Integration
- [ ] Create RuleManager class
- [ ] Link rules to profiles
- [ ] Update profile card to show actual rule count
- [ ] Implement rule copying when creating profiles

### Phase 3: Profile Switching
- [ ] Clear unlock sessions on profile switch
- [ ] Require master password for switching
- [ ] Add profile switch confirmation
- [ ] Update active rules when switching

### Phase 4: Import/Export
- [ ] Export profiles with encrypted data
- [ ] Import profiles from file
- [ ] Validate import data
- [ ] Handle version compatibility

## Testing

### Manual Testing Checklist

- [x] Create a new profile
- [x] Profile name validation (empty name)
- [x] Profile name uniqueness check
- [x] Edit profile name
- [x] Switch to different profile
- [x] Delete inactive profile
- [x] Attempt to delete active profile (should fail)
- [ ] Data persistence after page reload
- [ ] Encryption/decryption works correctly
- [ ] Storage in Chrome extension context
- [ ] Storage in browser localStorage fallback

### Automated Tests (TODO)

- Unit tests for EncryptionService
- Unit tests for StorageService
- Unit tests for ProfileManager
- Integration tests for profile workflows
- UI component tests

## Known Issues

1. **Temporary Password:** Currently using hardcoded `"temp-password-hash"` - needs actual master password implementation
2. **Rule Count:** Showing "0 rules" as RuleManager not yet implemented
3. **No Persistence Verification:** Need to test data survives page reload
4. **No Master Password UI:** Cannot actually secure the profiles yet

## Performance Considerations

- Encryption/decryption is async but fast (< 10ms typical)
- Profile list kept in memory for quick access
- Storage operations batched when possible
- Profile manager initialized once per session

## Browser Compatibility

- Chrome: Uses `chrome.storage.local`
- Firefox: Uses `chrome.storage.local` (browser namespace)
- Fallback: Uses `localStorage` for development

## License

Part of LinkLock browser extension.
