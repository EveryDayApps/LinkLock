# Quick Test Guide - LinkLock Extension

## 🔄 Reload the Extension

Since you already have it loaded, you need to reload it to get the latest changes:

### Chrome/Edge/Brave
1. Go to `chrome://extensions/`
2. Find LinkLock in the list
3. Click the **reload icon** (circular arrow) on the LinkLock card

### Firefox
1. Go to `about:debugging#/runtime/this-firefox`
2. Find LinkLock in the list
3. Click **Reload**

## ✅ Test the Options Page - NOW IT WORKS!

### Step 1: Open Options Page
1. Click the LinkLock icon in your browser toolbar
2. Click **"Open Settings"** button

OR directly go to:
- Chrome: `chrome-extension://[YOUR_EXTENSION_ID]/options.html`
- Firefox: `moz-extension://[YOUR_EXTENSION_ID]/options.html`

### Step 2: Set Master Password
When the options page opens, you should see a modal:
- **Title**: "Set Master Password"
- Enter a password (minimum 6 characters)
- Confirm the password
- Click **"Set Master Password"**

✅ The modal should close and you'll see the main options page

### Step 3: Add a Rule
Now the "Add New Rule" button should be **clickable**!

1. Click **"Add New Rule"**
2. A modal should open
3. Try adding a rule:
   - **URL Pattern**: `twitter.com`
   - **Action**: Choose "Lock" (default)
   - **Lock Mode**: Choose "Timed Unlock" (default)
   - **Duration**: 1 hour (default)
   - Click **"Create Rule"**

✅ The rule should appear in the "Protected Sites" section

### Step 4: Test the Rule
1. Navigate to `https://twitter.com` (or whatever site you locked)
2. Currently it won't redirect yet (navigation interception coming next)
3. But you can see the rule listed in the options page!

### Step 5: Delete a Rule
1. In the options page, find your rule
2. Click the **red trash icon** on the right
3. Confirm deletion

✅ The rule should disappear from the list

## 🐛 Troubleshooting

### Buttons still not clickable?
1. Make sure you reloaded the extension
2. Open browser DevTools (F12)
3. Check Console tab for any errors
4. Try removing and re-adding the extension

### Modal doesn't appear?
1. Check browser console for errors
2. Make sure React is loading (you should see the LinkLock UI)
3. Try refreshing the options page

### Can't see the extension icon?
1. Check that icons were generated: `ls public/icons/`
2. Rebuild: `yarn build:chrome`
3. Reload extension

## 🎯 What's Working Now

- ✅ Options page loads
- ✅ Master password modal appears on first use
- ✅ Can set master password
- ✅ "Add New Rule" button is clickable
- ✅ Add rule modal opens and works
- ✅ Can create rules
- ✅ Rules are saved to browser storage
- ✅ Can view list of rules
- ✅ Can delete rules

## 🚧 What's Next

To make the extension fully functional:

1. **Navigation Interception**: Currently rules are stored but don't actually block/lock sites
2. **Unlock Page Integration**: Connect the unlock page to work with actual rules
3. **Popup Updates**: Show real rule status in the popup

But for now, **the UI is fully functional** and you can create/manage rules!

## 📝 Notes

- All data is stored in browser local storage
- Master password is hashed with SHA-256
- Rules persist across browser restarts
- Everything is working client-side, no server needed

---

**Try it now! The options page should be fully interactive.** 🎉
