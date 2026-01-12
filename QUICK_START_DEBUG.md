# Quick Start: Debug Mode vs Production Mode

## 🔧 Development (Debug Mode - Plain Text)

```bash
# Run dev server with plain text storage
npm run dev:debug

# Or set environment variable
VITE_DEBUG_MODE=true npm run dev
```

**What you'll see in IndexedDB:**

```javascript
// Table: "profiles" (not "t1")
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  encryptedData: '{"id":"550e8400...","name":"Work","isActive":true}',
  iv: "debug-mode-no-iv",
  profileIds: ["abc123", "def456"]
}
```

## 🚀 Production (Encrypted)

```bash
# Build for production with encryption
npm run build:chrome
npm run build:firefox
npm run build:extensions
```

**What you'll see in IndexedDB:**

```javascript
// Table: "t1" (not "profiles")
{
  k: "xY9Zm2Kl3Np8Qr5Wt...",  // encrypted ID
  d: "qR7Wt4Yx8Zv2Bc...",      // encrypted data
  v: "aB5Cd9Ef2Gh7Jk...",      // IV
  p: ["mN3Pq6Rs9Tu...", ...]   // encrypted profile IDs
}
```

## 🎯 Quick Reference

| Feature         | Debug Mode            | Production            |
| --------------- | --------------------- | --------------------- |
| **Encryption**  | ❌ Disabled           | ✅ Enabled            |
| **Table Names** | `profiles`, `rules`   | `t1`, `t2`, `t3`      |
| **Field Names** | `id`, `encryptedData` | `k`, `d`, `v`, `p`    |
| **Data Format** | Plain JSON            | Encrypted Base64      |
| **Use Case**    | Development/Testing   | Production Deployment |

## ⚠️ Important

- **NEVER** deploy debug mode to production
- Debug mode stores ALL data in plain text
- Anyone can read the data from IndexedDB
- Always verify production builds don't have `VITE_DEBUG_MODE=true`
