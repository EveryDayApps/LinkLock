# Navigation System Update

## Overview

The app has been refactored to use a **sidebar navigation** system with separate screen components. When users click menu items in the drawer, they navigate to full-screen views with a persistent sidebar.

## Architecture

### Home Screen
- Initial landing page with "Open Menu" button
- Opens drawer with vertical navigation menu

### Navigation Flow
1. **Home** → Click "Open Menu" → **Drawer opens**
2. **Drawer** → Click any menu item → **Navigate to that screen**
3. **Screen** → Persistent sidebar on left, content on right
4. **Sidebar** → Click "← Home" → Return to home screen

## File Structure

```
src/
├── App.tsx                              # Main app with routing logic
├── components/
│   ├── core/
│   │   └── DrawerContent.tsx           # Vertical menu drawer (280px)
│   ├── screens/
│   │   ├── ProfilesScreen.tsx          # Profiles management
│   │   ├── RulesScreen.tsx             # Rules management (placeholder)
│   │   ├── ImportExportScreen.tsx      # Import/Export (placeholder)
│   │   ├── SettingsScreen.tsx          # Settings (placeholder)
│   │   └── AboutScreen.tsx             # About page
│   └── profiles/
│       └── ProfilesTab.tsx             # Profile management UI
```

## Components

### App.tsx

**State:**
- `currentScreen`: Tracks active screen (home | profiles | rules | etc.)
- `isDrawerOpen`: Controls drawer visibility

**Layout:**
- **Home screen:** Centered content with "Open Menu" button
- **Other screens:** Two-column layout:
  - Left: 256px sidebar with navigation
  - Right: Full-width scrollable content

**Navigation:**
```typescript
const handleNavigate = (screen: ScreenType) => {
  setCurrentScreen(screen);
  setIsDrawerOpen(false); // Auto-close drawer
};
```

### DrawerContent.tsx

**Vertical Navigation Menu:**
- Icon + Label for each menu item
- Hover effects with indigo accent
- SVG icons for visual clarity
- Version info at bottom

**Menu Items:**
1. Rules
2. Profiles
3. Import / Export
4. Settings
5. About

### Screen Components

#### ProfilesScreen.tsx
- Wraps `ProfilesTab` component
- Full profile management interface
- Create, edit, switch, delete profiles

#### RulesScreen.tsx (Placeholder)
- Future: Rule management per profile
- Lock/Block/Redirect rules

#### ImportExportScreen.tsx (Placeholder)
- Future: Backup and restore functionality

#### SettingsScreen.tsx (Placeholder)
- Future: Master password, security settings

#### AboutScreen.tsx
- App information and version
- Feature list
- Privacy information
- GitHub link

## UI/UX Features

### Sidebar Navigation (Screens)
- Fixed 256px width
- Dark background (gray-950)
- Active state with indigo background
- Hover states on all items
- "← Home" button to return

### Drawer (Home)
- 280px width
- Slides from left
- Vertical list with icons
- Auto-closes on navigation
- Version info at bottom

### Responsive Behavior
- Full-height layout
- Scrollable content area
- Fixed sidebar
- Smooth transitions

## User Flow Examples

### Create a Profile
1. Home → Click "Open Menu"
2. Drawer → Click "Profiles"
3. Profiles screen opens with sidebar
4. Click "+ New Profile"
5. Enter name → Create
6. Profile appears in list

### Switch Between Screens
1. Currently on Profiles screen
2. Sidebar → Click "Rules"
3. Rules screen loads
4. Sidebar shows Rules as active

### Return Home
1. Any screen with sidebar
2. Click "← Home" in sidebar
3. Return to centered home screen

## Styling

### Color Scheme
- **Background:** bg-background (dark)
- **Sidebar:** bg-gray-950
- **Border:** border-gray-800
- **Active:** bg-indigo-600
- **Hover:** bg-gray-800 / text-indigo-400

### Typography
- **Headings:** text-gray-100, font-bold
- **Body:** text-gray-400
- **Links:** text-indigo-400

## Development

### Adding a New Screen

1. **Create screen component:**
```typescript
// src/components/screens/MyScreen.tsx
export function MyScreen() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-100">My Screen</h1>
      {/* Content */}
    </div>
  );
}
```

2. **Add to App.tsx:**
```typescript
import { MyScreen } from "./components/screens/MyScreen";

// Add to ScreenType
export type ScreenType = "home" | "my-screen" | ...;

// Add case to renderScreen()
case "my-screen":
  return <MyScreen />;

// Add to sidebar nav (in both App.tsx and DrawerContent.tsx)
```

3. **Add menu item to DrawerContent.tsx:**
```typescript
{
  label: "My Screen",
  screen: "my-screen",
  icon: "M..." // SVG path
}
```

## Testing

### Manual Testing
- [x] Navigate from home to each screen
- [x] Verify sidebar appears on screens
- [x] Test "← Home" button
- [x] Verify drawer closes after navigation
- [x] Test active states in sidebar
- [x] Verify all icons display correctly

### Edge Cases
- [x] Direct navigation (URL refresh)
- [x] Drawer open/close states
- [x] Screen transitions
- [x] Responsive behavior

## Benefits

✅ **Clear Navigation:** Vertical menu is easier to scan
✅ **Consistent Layout:** Sidebar present on all screens
✅ **Better UX:** Dedicated space for each feature
✅ **Scalable:** Easy to add new screens
✅ **Professional:** Standard sidebar + content layout
✅ **Mobile-Friendly:** Can adapt sidebar to drawer on mobile

## Next Steps

1. **Implement Rules Screen**
   - Rule management UI
   - Create/Edit/Delete rules
   - Link rules to active profile

2. **Implement Settings Screen**
   - Master password setup
   - Security options
   - Extension preferences

3. **Implement Import/Export Screen**
   - Export profiles + rules to JSON
   - Import from file
   - Data validation

4. **Add Breadcrumbs** (Optional)
   - Show current location
   - Quick navigation

5. **Mobile Responsive**
   - Collapse sidebar to hamburger menu
   - Full-screen drawer on mobile

## Migration from Old System

**Before:** Horizontal tabs in drawer
**After:** Vertical menu in drawer → Full screens with sidebar

**Changes:**
- DrawerContent: Removed tab content, now just navigation
- App.tsx: Added screen routing and sidebar layout
- New: Screen components for each section

**Preserved:**
- All profile management functionality
- ProfilesTab component unchanged
- UI components (Button, Card, Dialog, etc.)
