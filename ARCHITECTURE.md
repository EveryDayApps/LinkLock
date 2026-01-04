# LinkLock Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│  React Components (UI Layer)                                    │
│  - AddLinkModal, UnlockPage, OptionsPage, etc.                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Service                           │
│  Central Orchestrator (Singleton)                               │
│  - Initializes all services/managers                            │
│  - Handles unlock attempts                                      │
│  - Evaluates URLs against rules                                 │
└──────────────────────┬───────────────┬─────────────────────────┘
                       │               │
           ┌───────────┴────┐    ┌────┴──────────┐
           │                │    │               │
           ▼                ▼    ▼               ▼
    ┌──────────┐    ┌──────────────┐    ┌──────────────┐
    │ Services │    │   Managers   │    │   Storage    │
    └──────────┘    └──────────────┘    └──────────────┘
```

## Detailed Architecture

### 1. Services Layer (Core Logic)

```
┌─────────────────────────────────────────────────────────┐
│                   Services                               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  PasswordService                                         │
│  ├─ hashPassword(password) → hash                       │
│  ├─ verifyPassword(password, hash) → boolean            │
│  └─ validatePasswordStrength(password) → validation     │
│                                                          │
│  EncryptionService                                       │
│  ├─ encrypt(data, masterHash) → {encrypted, iv}         │
│  ├─ decrypt(encrypted, iv, masterHash) → data           │
│  └─ deriveKey(passwordHash) → CryptoKey                 │
│                                                          │
│  StorageService                                          │
│  ├─ save<T>(key, data, masterHash)                      │
│  ├─ load<T>(key, masterHash) → data                     │
│  └─ saveUnencrypted<T>(key, data)                       │
│                                                          │
│  RuleMatcher                                             │
│  ├─ matchesPattern(url, pattern) → boolean              │
│  ├─ findMatchingRule(url, rules) → LinkRule | null      │
│  └─ validatePattern(pattern) → validation               │
│                                                          │
│  RuleEvaluator                                           │
│  └─ evaluate(url, rules, profileId) → EvaluationResult  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2. Managers Layer (State Management)

```
┌──────────────────────────────────────────────────────────┐
│                    Managers                               │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  UnlockSessionManager                                     │
│  ├─ unlock(domain, duration, profileId)                  │
│  ├─ isUnlocked(domain) → boolean                         │
│  ├─ lock(domain)                                          │
│  ├─ snooze(domain, duration, profileId)                  │
│  └─ isSnoozed(domain) → boolean                          │
│                                                           │
│  CooldownManager                                          │
│  ├─ recordFailedAttempt(domain) → triggered cooldown     │
│  ├─ isInCooldown(domain) → boolean                       │
│  ├─ getRemainingCooldown(domain) → seconds               │
│  └─ resetAttempts(domain)                                │
│                                                           │
│  ProfileManager                                           │
│  ├─ createProfile(name) → profileId                      │
│  ├─ switchProfile(profileId, masterPass)                 │
│  ├─ getActiveProfile() → Profile | null                  │
│  ├─ deleteProfile(profileId)                             │
│  └─ renameProfile(profileId, newName)                    │
│                                                           │
│  RuleManager                                              │
│  ├─ createRule(urlPattern, action, options) → ruleId     │
│  ├─ updateRule(ruleId, updates)                          │
│  ├─ deleteRule(ruleId)                                   │
│  ├─ getRulesByProfile(profileId) → LinkRule[]            │
│  └─ toggleRule(ruleId)                                   │
│                                                           │
│  ActivityLogger                                           │
│  ├─ logUnlockSuccess(domain, profileId)                  │
│  ├─ logUnlockFailed(domain, profileId, attempts)         │
│  ├─ logRedirect(domain, profileId, target)               │
│  ├─ logBlocked(domain, profileId)                        │
│  └─ getLogs(filters) → ActivityLogEntry[]                │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 3. Data Flow

#### Creating a Link Rule

```
User fills AddLinkModal
        ↓
Click "Save Link"
        ↓
Hash custom password (if enabled)
        ↓
appService.ruleManager.createRule()
        ↓
Validate URL pattern
        ↓
Validate action options
        ↓
Create LinkRule object
        ↓
StorageService.save() → Encrypted to localStorage
        ↓
Success callback → Close modal
```

#### Unlock Flow

```
User navigates to locked site
        ↓
appService.evaluateUrl(url)
        ↓
RuleEvaluator.evaluate()
        ├─ Find matching rule
        ├─ Check if unlocked
        └─ Return { action: 'require_unlock', rule }
        ↓
Show unlock page
        ↓
User enters password
        ↓
appService.handleUnlockAttempt(domain, password, ruleId)
        ├─ Check cooldown
        ├─ Verify password (custom or master)
        ├─ Record attempt
        └─ If success:
            ├─ UnlockSessionManager.unlock()
            ├─ CooldownManager.resetAttempts()
            └─ ActivityLogger.logUnlockSuccess()
        ↓
Redirect to original URL
```

## Security Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Security Layers                          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Layer 1: Password Hashing                               │
│  ├─ SHA-256 for master password                          │
│  ├─ SHA-256 for custom passwords                         │
│  └─ Never store plaintext passwords                      │
│                                                           │
│  Layer 2: Key Derivation                                 │
│  ├─ PBKDF2 with 100,000 iterations                       │
│  ├─ Static salt: "linklock-salt"                         │
│  └─ Derives AES-GCM key from master password hash        │
│                                                           │
│  Layer 3: Data Encryption                                │
│  ├─ AES-GCM (256-bit) for all sensitive data             │
│  ├─ Random IV per encryption                             │
│  └─ Encrypted storage in localStorage                    │
│                                                           │
│  Layer 4: Attack Prevention                              │
│  ├─ Failed attempt tracking                              │
│  ├─ Cooldown after N failed attempts                     │
│  └─ Auto-reset on success                                │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Storage Structure

```
localStorage (Encrypted)
├─ profiles            → Profile[]
├─ rules               → LinkRule[]
├─ unlock_sessions     → UnlockSession[]
├─ cooldown_states     → CooldownState[]
├─ snooze_states       → SnoozeState[]
└─ activity_logs       → ActivityLogEntry[]

Each value stored as:
{
  encrypted: "base64_encrypted_data",
  iv: "base64_initialization_vector"
}
```

## Technology Stack

```
┌──────────────────────────────────────────────────────────┐
│                 Technology Stack                          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Frontend                                                 │
│  ├─ React 18                                             │
│  ├─ TypeScript 5                                         │
│  ├─ Tailwind CSS                                         │
│  └─ Lucide React (icons)                                 │
│                                                           │
│  Build Tools                                              │
│  ├─ Vite                                                 │
│  └─ PostCSS                                              │
│                                                           │
│  Security                                                 │
│  ├─ Web Crypto API (SHA-256, AES-GCM, PBKDF2)           │
│  └─ No external crypto libraries                         │
│                                                           │
│  State Management                                         │
│  ├─ ApplicationService (singleton)                       │
│  └─ In-memory Maps + localStorage persistence            │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. **Singleton ApplicationService**
- Single entry point for all operations
- Manages initialization state
- Coordinates between services and managers

### 2. **Encrypted Storage**
- All sensitive data encrypted before storage
- Master password never stored in plaintext
- PBKDF2 key derivation adds computational cost to attacks

### 3. **Profile-Based Rules**
- Each rule belongs to one profile
- Only active profile's rules are evaluated
- Switching profiles clears all unlock sessions

### 4. **Timer Management**
- Auto-lock timers set on unlock
- Timers restored from storage on page load
- All timers cleared on profile switch

### 5. **Cooldown Protection**
- Prevents brute force attacks
- Configurable limits and duration
- Per-domain tracking

### 6. **Activity Logging**
- Optional (can be disabled)
- Max 1000 entries (circular buffer)
- Filterable by type, domain, profile, date

## Future Extensions

### Browser Extension Integration
```
Background Script
├─ Navigation listener
│  └─ Intercept navigation → Evaluate URL → Block/Redirect/Show unlock
├─ Message handler
│  └─ UI ↔ Background communication
└─ Timer management
   └─ Restore timers on browser restart
```

### Import/Export
```
Export Flow:
Application Data → Encrypt with master password → JSON file

Import Flow:
JSON file → Decrypt with master password → Validate → Load into managers
```
