# 🔒 Link Lock — Complete Feature Specification

A privacy first, cross browser browser extension that password protects websites with fine grained control, profiles, and timed access

---

## 🧰 Tech Stack

### Core Stack

- **React** — UI for unlock page and options page
- **TypeScript** — Type-safe, scalable codebase
- **Vite** — Fast bundler and build system
- **Tailwind CSS** — Utility-first styling
- **Yarn** — Dependency and workspace management

---

### Browser Support

- ✅ Google Chrome (Manifest V3)
- ✅ Mozilla Firefox (Manifest V2)

---

### Cross-Browser Strategy

- **Single shared codebase**
- **No direct `chrome.*` or `browser.*` usage**
- All browser APIs accessed via a **browser abstraction layer**
- Business logic remains **100% browser-agnostic**

---

## 🧠 Architectural Principles

- Background script handles:
  - Navigation interception
  - Rule evaluation
  - Timers
  - Session unlock state
- React handles:
  - Unlock UI
  - Options / settings UI
- Communication via:
  - Runtime message passing
- No UI logic inside background
- No browser conditionals in business logic

---

## 🔑 Authentication & Access Model

### 1. Master Password (Mandatory)

- On **first launch**, user must set a **Master Password**
- On **every settings open**, master password is required
- Master password is required for:
  - Unlocking sites (default)
  - Editing rules
  - Deleting rules
  - Import / Export
  - Profile switching
  - Resetting settings

> 🔐 No access to extension settings without the master password

---

### 2. Per-Site Custom Password (Optional)

- Each site rule includes a **“Use Custom Password” toggle**
- When enabled:
  - That site requires its **own password**
- When disabled:
  - Site uses the **master password**
- Password precedence:
  - **Custom password > Master password**

---

## 🌐 Website Rule System

Each rule applies to **one URL pattern** and is independently configurable.

### Supported URL Types

- Exact domain  
  `example.com`
- Subdomain  
  `mail.example.com`
- Wildcard  
  `*.example.com`

---

### Rule Actions (One Per Rule)

1. 🔐 **Lock**

   - Password required to access

2. 🚫 **Block**

   - Website is completely blocked

3. 🔁 **Redirect**
   - Redirect to:
     - Another URL
     - Custom internal lock page

---

## ⏱ Lock Timing & Behavior (Per Domain)

Timers apply **only to the configured domain**.

### Lock Modes

- 🔁 **Always Ask**

  - Password required on every visit

- ⏱ **Timed Unlock**

  - Unlock after password for:
    - Immediately (lock again instantly)
    - 1 minute
    - 5 minutes
    - 10 minutes
    - Custom duration

- 🔓 **Session Unlock**
  - Unlock until browser restart

### Timer Rules

- Timers are **domain-wide**
- Applies across all tabs
- If domain is unlocked:
  - Opening same domain in another tab works
- After timer expires:
  - Password required again

---

## ⏸ Snooze (Temporary Bypass)

- Temporarily unlock a site for:
  - 5 minutes
  - 30 minutes
  - Today
- Automatically re-locks after snooze period
- Requires master password

---

## 👤 Profiles / Modes

Users can create multiple profiles, such as:

- Work
- Focus
- Kids
- Personal

Each profile has:

- Independent rules
- Independent passwords
- Independent timers

Profile switching:

- Manual
- Requires master password

---

## 🔐 Security & Protection

### Password Handling

- All passwords:
  - Hashed using **SHA-256**
  - Never stored in plaintext
- All sensitive data:
  - Encrypted before storing in browser storage
- Uses **Web Crypto API only**

---

### Attempt Limits & Cooldown

- Configurable maximum failed attempts per site
- After limit reached:
  - Input locked for cooldown period
  - Or require master password
- Prevents brute-force attempts

---

### Read-Only Protection

Master password required for:

- Editing rules
- Deleting rules
- Import / export
- Resetting all data

---

## 📦 Import / Export

- Export all data as **encrypted file**
- Import restores:
  - Profiles
  - Rules
  - Timers
- Import / export always requires master password
- No cloud sync — fully local storage

---

## 📊 Optional Local Activity Log

(Local only, no tracking)

- Last unlock time
- Failed attempt counts
- Redirect events

User can disable logs anytime.

---

## 🧩 Browser Abstraction Layer (Mandatory)

- A single **Extension API interface** defines required browser functionality
- Browser-specific implementations:
  - Chrome Adapter
  - Firefox Adapter
- Runtime resolver selects implementation automatically
- No browser-specific conditionals outside adapter layer

---

## ❌ Explicit Limitations (By Design)

- Cannot prevent uninstall
- No password on removal
- DevTools can bypass logic
- `chrome://` and `about:` URLs cannot be locked
- No analytics or remote storage

---

## 🎯 Target Users

- Productivity & focus users
- Parents / shared devices
- Privacy-conscious users
- Developers & power users

---

## 🏁 Summary

Link Lock provides:

- Fine-grained per-site locking
- Strong local-only security
- Flexible timing & profiles
- Clean cross-browser architecture
- Modern TypeScript + React stack

A powerful, extensible, privacy-first website control extension.
