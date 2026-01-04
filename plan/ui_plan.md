# 🎨 Link Lock — UI Implementation Plan

A comprehensive plan for building all UI components with a dark, minimal aesthetic.

---

## 🎯 UI Philosophy

- **Dark Mode First** — Deep backgrounds, subtle contrasts
- **Minimal & Clean** — No visual clutter, purposeful whitespace
- **Accessible** — Clear hierarchy, readable text, keyboard navigation
- **Consistent** — Unified design system across all screens

---

## 🎨 Design System

### Color Palette

```typescript
// Dark Theme
--bg-primary: #0a0a0a        // Main background
--bg-secondary: #141414      // Card/panel background
--bg-tertiary: #1f1f1f       // Input/hover states
--bg-accent: #2a2a2a         // Highlighted elements

--text-primary: #e5e5e5      // Main text
--text-secondary: #a3a3a3    // Secondary text
--text-muted: #666666        // Disabled/muted text

--border: #2a2a2a            // Default borders
--border-focus: #404040      // Focused elements

--accent-primary: #6366f1    // Primary actions (indigo)
--accent-danger: #ef4444     // Destructive actions (red)
--accent-success: #10b981    // Success states (green)
--accent-warning: #f59e0b    // Warning states (amber)
```

### Typography

```typescript
// Font Family
--font-sans: 'Inter', -apple-system, system-ui, sans-serif
--font-mono: 'JetBrains Mono', 'Fira Code', monospace

// Font Sizes
--text-xs: 0.75rem    // 12px - Captions
--text-sm: 0.875rem   // 14px - Secondary text
--text-base: 1rem     // 16px - Body text
--text-lg: 1.125rem   // 18px - Subheadings
--text-xl: 1.25rem    // 20px - Headings
--text-2xl: 1.5rem    // 24px - Page titles
```

### Spacing Scale

```typescript
// Consistent spacing
--space-1: 0.25rem   // 4px
--space-2: 0.5rem    // 8px
--space-3: 0.75rem   // 12px
--space-4: 1rem      // 16px
--space-6: 1.5rem    // 24px
--space-8: 2rem      // 32px
```

### Component Styles

```typescript
// Buttons
--btn-height: 2.5rem          // 40px
--btn-padding: 0.75rem 1.5rem
--btn-radius: 0.5rem          // 8px

// Inputs
--input-height: 2.5rem        // 40px
--input-padding: 0.75rem 1rem
--input-radius: 0.5rem        // 8px

// Cards
--card-radius: 0.75rem        // 12px
--card-padding: 1.5rem        // 24px
```

---

## 🏗 UI Architecture

### Component Hierarchy

```
src/
├── ui/
│   ├── components/
│   │   ├── common/          # Reusable primitives
│   │   ├── drawer/          # Main drawer & tabs
│   │   ├── unlock/          # Unlock page components
│   │   └── settings/        # Settings-specific components
│   ├── pages/
│   │   ├── UnlockPage.tsx
│   │   ├── OptionsPage.tsx
│   │   └── WelcomePage.tsx
│   └── styles/
│       ├── globals.css
│       └── tokens.css       # Design tokens
```

---

## 📋 Component Breakdown

### 1. 🧱 Common Components (Foundation)

**Priority: High** — Build these first

#### 1.1 Button

**Variants:**

- `primary` — Main actions (filled indigo)
- `secondary` — Secondary actions (outlined)
- `danger` — Destructive actions (filled red)
- `ghost` — Minimal actions (text only)

**Props:**

```typescript
interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: () => void;
}
```

**Visual States:**

- Default
- Hover (subtle brightness increase)
- Active (slight scale down)
- Disabled (reduced opacity)
- Loading (spinner + disabled state)

---

#### 1.2 Input

**Types:**

- Text
- Password (with show/hide toggle)
- Number
- Search (with search icon)

**Props:**

```typescript
interface InputProps {
  type?: "text" | "password" | "number" | "search";
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
}
```

**Features:**

- Label floating animation
- Error state with message
- Character counter (if maxLength set)
- Clear button (for search)
- Eye icon toggle (for password)

---

#### 1.3 Card

**Props:**

```typescript
interface CardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}
```

**Visual:**

- Subtle border
- Slight shadow on hover (if hoverable)
- Optional header section
- Optional footer/actions section

---

#### 1.4 Toggle Switch

**Props:**

```typescript
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}
```

**Visual:**

- Smooth slide animation
- Color transition
- Disabled state (greyed out)

---

#### 1.5 Select Dropdown

**Props:**

```typescript
interface SelectProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}
```

**Visual:**

- Custom styled (no native select)
- Chevron icon
- Dropdown menu with search (if >10 options)
- Keyboard navigation

---

#### 1.6 Modal

**Props:**

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}
```

**Features:**

- Backdrop with blur
- Slide-up animation
- ESC to close
- Click outside to close
- Focus trap

---

#### 1.7 Toast Notification

**Types:**

- Success
- Error
- Warning
- Info

**Props:**

```typescript
interface ToastProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number; // ms
  onClose?: () => void;
}
```

**Features:**

- Slide-in from top-right
- Auto-dismiss after duration
- Manual close button
- Queue system (stack multiple toasts)

---

#### 1.8 Icon System

**Implementation:**

- Use **Lucide React** icons
- Consistent sizing (16px, 20px, 24px)
- Color inherits from parent

**Common Icons:**

- Lock, Unlock, Eye, EyeOff
- Settings, Plus, Trash, Edit
- Check, X, ChevronDown, ChevronRight
- Clock, Calendar, Shield

---

### 2. 🎭 Unlock Page Components

**Priority: High** — Core user-facing feature

#### 2.1 UnlockPage Layout

**Structure:**

```
┌─────────────────────────────┐
│                             │
│   [Lock Icon - Large]       │
│                             │
│   Site Name / Logo          │
│   example.com               │
│                             │
│   [Password Input]          │
│                             │
│   [Unlock Duration Select]  │
│                             │
│   [Unlock Button]           │
│                             │
│   ─────────────────         │
│                             │
│   [Snooze Options]          │
│                             │
└─────────────────────────────┘
```

**Features:**

- Centered, minimal layout
- Site favicon/logo display
- Animated lock icon
- Password input with enter-to-submit
- Unlock duration selector
- Snooze shortcuts
- Failed attempt counter
- Cooldown timer (if locked out)

---

#### 2.2 Password Input Component

**Specific Features:**

- Large, focused input
- Show/hide toggle
- Enter key triggers unlock
- Auto-focus on mount
- Error shake animation on wrong password
- Disabled state during cooldown

---

#### 2.3 Unlock Duration Selector

**Options Display:**

```
○ Always Ask
○ 1 minute
○ 5 minutes
○ 10 minutes
○ Until browser restart
○ Custom (input box appears)
```

**Visual:**

- Radio button style
- Horizontal or vertical layout
- Highlighted selection

---

#### 2.4 Snooze Panel

**Quick Actions:**

```
[5 min] [30 min] [Today]
```

**Visual:**

- Small, secondary buttons
- Below main unlock button
- Subtle divider above
- Tooltip explaining snooze

---

#### 2.5 Cooldown/Lockout Display

**When locked out:**

```
┌─────────────────────────────┐
│   ⏱ Too Many Attempts       │
│                             │
│   Try again in 2:45         │
│                             │
│   Or unlock with            │
│   Master Password           │
│                             │
│   [Use Master Password]     │
└─────────────────────────────┘
```

**Features:**

- Live countdown timer
- Clear messaging
- Master password bypass option

---

### 3. 🗂 Options Page (Drawer) — Main UI Hub

**Priority: High** — Primary configuration interface

#### 3.1 Drawer Shell

**Layout:**

```
┌─────────────────────────────────────────┐
│ Link Lock                     [Close]   │
├─────────────────────────────────────────┤
│ [Tabs]                                  │
│ • Links                                 │
│ • Profiles                              │
│ • Settings                              │
│ • Import/Export                         │
│ • Activity Log                          │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│        [Active Tab Content]             │
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**

- Full-height drawer
- Tabs in left sidebar (vertical)
- Active tab highlighted
- Responsive: collapse to bottom sheet on mobile

---

#### 3.2 Tab: 🔗 Links Management

**Layout:**

```
┌─────────────────────────────────────────┐
│ Links                      [+ Add Link] │
├─────────────────────────────────────────┤
│ [Search input]              [Filter ▾]  │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔒 example.com           [Edit] [...] │
│ │ Lock • 5 min unlock                  │
│ │ Custom password: Yes                 │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🚫 youtube.com           [Edit] [...] │
│ │ Block • Always                       │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔁 twitter.com           [Edit] [...] │
│ │ Redirect → focus-mode.html           │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**

- Search by domain name
- Filter by action type (Lock/Block/Redirect)
- Add new link button (opens modal/form)
- Each link card shows:
  - Domain name
  - Action type with icon
  - Unlock duration (if Lock)
  - Custom password indicator
- Edit button (requires master password)
- Context menu (⋮) for quick actions:
  - Duplicate
  - Delete
  - Disable temporarily

---

#### 3.3 Tab: 👤 Profiles Management

**Layout:**

```
┌─────────────────────────────────────────┐
│ Profiles                [+ New Profile] │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ● Work                    [Switch]  │ │
│ │ 12 links • Active                   │ │
│ │ [Edit] [Delete]                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ○ Focus                   [Switch]  │ │
│ │ 5 links                             │ │
│ │ [Edit] [Delete]                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ○ Kids                    [Switch]  │ │
│ │ 8 links                             │ │
│ │ [Edit] [Delete]                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**

- Active profile clearly marked
- Switch profile (requires master password)
- Create new profile modal:
  - Profile name
  - Copy rules from existing profile?
  - Set profile-specific master password?
- Edit profile:
  - Rename
  - Change password
- Delete profile (with confirmation)

---

#### 3.4 Tab: ⚙️ Settings

**Sections:**

**3.4.1 Master Password**

```
┌─────────────────────────────────────────┐
│ Master Password                         │
│ ───────────────────────────────────────  │
│                                         │
│ [Change Master Password]                │
│                                         │
│ Requires entering current password      │
└─────────────────────────────────────────┘
```

**3.4.2 Security**

```
┌─────────────────────────────────────────┐
│ Security                                │
│ ───────────────────────────────────────  │
│                                         │
│ Failed Attempt Limit                    │
│ [5] attempts                            │
│                                         │
│ Cooldown Duration                       │
│ [5 minutes ▾]                           │
│                                         │
│ ☐ Require master password after cooldown│
└─────────────────────────────────────────┘
```

**3.4.3 Activity Logging**

```
┌─────────────────────────────────────────┐
│ Activity Logging                        │
│ ───────────────────────────────────────  │
│                                         │
│ ☑ Track unlock events                   │
│ ☑ Track failed attempts                 │
│ ☐ Track redirect events                 │
│                                         │
│ [Clear All Logs]                        │
└─────────────────────────────────────────┘
```

**3.4.4 Danger Zone**

```
┌─────────────────────────────────────────┐
│ Danger Zone                             │
│ ───────────────────────────────────────  │
│                                         │
│ [Reset All Settings]                    │
│ Removes all rules, profiles, and data   │
│                                         │
└─────────────────────────────────────────┘
```

---

#### 3.5 Tab: 📦 Import / Export

**Layout:**

```
┌─────────────────────────────────────────┐
│ Import / Export                         │
├─────────────────────────────────────────┤
│                                         │
│ Export Configuration                    │
│ ───────────────────────────────────────  │
│                                         │
│ ☑ Include all profiles                  │
│ ☑ Include all rules                     │
│ ☐ Include activity logs                 │
│                                         │
│ [Export as Encrypted File]              │
│                                         │
│ ───────────────────────────────────────  │
│                                         │
│ Import Configuration                    │
│ ───────────────────────────────────────  │
│                                         │
│ [Choose File] or drag & drop            │
│                                         │
│ ⚠️ This will replace all current data   │
│                                         │
│ [Import]                                │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**

- Export options checkboxes
- Import with file picker or drag-drop
- Master password required for both
- Confirmation modal before import
- Success/error toasts

---

#### 3.6 Tab: 📊 Activity Log

**Layout:**

```
┌─────────────────────────────────────────┐
│ Activity Log              [Clear All]   │
├─────────────────────────────────────────┤
│ [Filter ▾] [Date Range]                 │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔓 example.com unlocked              │ │
│ │ 2:45 PM • Session unlock             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ❌ youtube.com failed (3 attempts)   │ │
│ │ 2:30 PM • Wrong password             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔁 twitter.com redirected            │ │
│ │ 1:15 PM → focus-mode.html            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│                [Load More]              │
└─────────────────────────────────────────┘
```

**Features:**

- Filter by event type
- Date range picker
- Paginated list
- Color-coded icons
- Clear all (with confirmation)

---

### 4. 🎬 Welcome/Onboarding Page

**Priority: Medium** — First-run experience

**Flow:**

**Step 1: Welcome**

```
┌─────────────────────────────────────────┐
│                                         │
│         🔒 Welcome to Link Lock         │
│                                         │
│   Take control of your browsing with    │
│   password-protected websites           │
│                                         │
│              [Get Started]              │
│                                         │
└─────────────────────────────────────────┘
```

**Step 2: Set Master Password**

```
┌─────────────────────────────────────────┐
│                                         │
│       Set Your Master Password          │
│                                         │
│   [Password Input]                      │
│                                         │
│   [Confirm Password]                    │
│                                         │
│   • At least 8 characters               │
│   • Mix of letters & numbers            │
│                                         │
│              [Continue]                 │
│                                         │
└─────────────────────────────────────────┘
```

**Step 3: Quick Tour**

```
┌─────────────────────────────────────────┐
│                                         │
│         Quick Tour (Optional)           │
│                                         │
│   [Screenshot/Animation]                │
│                                         │
│   Add locks to any website              │
│   Set timed unlocks                     │
│   Create custom profiles                │
│                                         │
│         [Skip]     [Next →]             │
│                                         │
└─────────────────────────────────────────┘
```

---

### 5. 📝 Forms & Modals

#### 5.1 Add/Edit Link Modal

```
┌─────────────────────────────────────────┐
│ Add Link                       [Close]  │
├─────────────────────────────────────────┤
│                                         │
│ Website URL                             │
│ [example.com]                           │
│                                         │
│ Action                                  │
│ ○ Lock                                  │
│ ○ Block                                 │
│ ○ Redirect                              │
│                                         │
│ ─── Lock Options ───                    │
│                                         │
│ Unlock Duration                         │
│ [5 minutes ▾]                           │
│                                         │
│ ☐ Use custom password                   │
│                                         │
│ ─────────────────                       │
│                                         │
│          [Cancel]  [Save Link]          │
│                                         │
└─────────────────────────────────────────┘
```

**Dynamic Sections:**

- Lock options (only if Lock selected)
- Redirect URL input (only if Redirect selected)
- Custom password input (if toggle enabled)

---

#### 5.2 Master Password Prompt Modal

```
┌─────────────────────────────────────────┐
│ Enter Master Password          [Close]  │
├─────────────────────────────────────────┤
│                                         │
│ This action requires your               │
│ master password                         │
│                                         │
│ [Password Input]                        │
│                                         │
│                                         │
│          [Cancel]  [Confirm]            │
│                                         │
└─────────────────────────────────────────┘
```

---

#### 5.3 Delete Confirmation Modal

```
┌─────────────────────────────────────────┐
│ Delete Link?                   [Close]  │
├─────────────────────────────────────────┤
│                                         │
│ Are you sure you want to delete         │
│ the rule for example.com?               │
│                                         │
│ This action cannot be undone.           │
│                                         │
│                                         │
│          [Cancel]  [Delete]             │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎬 Animations & Transitions

### Micro-interactions

```typescript
// Hover states
transition: all 0.15s ease-in-out

// Modal entry
animation: slideUp 0.2s ease-out

// Toast notifications
animation: slideInRight 0.3s ease-out

// Loading states
animation: spin 1s linear infinite

// Error shake
animation: shake 0.3s ease-in-out
```

### Page Transitions

- Unlock page: Fade in
- Modal: Slide up + fade
- Drawer tabs: Instant (no transition)
- Toast: Slide in from right

---

## 📱 Responsive Behavior

### Breakpoints

```typescript
sm: 640px   // Mobile landscape
md: 768px   // Tablet
lg: 1024px  // Desktop
```

### Drawer Responsive Strategy

- **Desktop (≥1024px)**: Side drawer (400px wide)
- **Tablet (768-1023px)**: Slide-over drawer (full height)
- **Mobile (<768px)**: Bottom sheet (tabs horizontal scroll)

---

## ♿️ Accessibility

### Keyboard Navigation

- All interactive elements: `tab` accessible
- Modals: ESC to close
- Forms: Enter to submit
- Drawer tabs: Arrow keys navigation

### ARIA Labels

- All icons have `aria-label`
- Form inputs have `aria-describedby` for errors
- Modals have `role="dialog"` and `aria-modal="true"`
- Loading states have `aria-busy="true"`

### Focus Management

- Focus trap in modals
- Visible focus rings (custom styled)
- Skip to content link

---

## 🧪 Component Testing Strategy

### Unit Tests (Vitest)

- Button variants render correctly
- Input validation works
- Toggle state changes
- Form submission logic

### Integration Tests

- Unlock flow completes
- Link creation persists
- Profile switching works
- Import/export roundtrip

### Visual Tests (Storybook)

- All component variants
- Dark mode consistency
- Responsive layouts
- Interactive states

---

## 📦 Implementation Priority

### Phase 1: Foundation (Week 1)

✅ Design tokens & global styles  
✅ Common components (Button, Input, Card, Toggle)  
✅ Icon system setup  
✅ Modal & Toast components

### Phase 2: Core Pages (Week 2)

✅ Unlock page layout  
✅ Password input with validation  
✅ Unlock duration selector  
✅ Snooze panel

### Phase 3: Options Drawer (Week 3)

✅ Drawer shell & tab navigation  
✅ Links management tab  
✅ Settings tab  
✅ Master password modal

### Phase 4: Advanced Features (Week 4)

✅ Profiles management tab  
✅ Import/Export tab  
✅ Activity log tab  
✅ Welcome/onboarding flow

### Phase 5: Polish & Testing (Week 5)

✅ Animations & micro-interactions  
✅ Accessibility audit  
✅ Responsive testing  
✅ Component tests

---

## 📁 File Structure

```
src/ui/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Toggle.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── Icon.tsx
│   ├── drawer/
│   │   ├── Drawer.tsx
│   │   ├── TabNavigation.tsx
│   │   ├── tabs/
│   │   │   ├── LinksTab.tsx
│   │   │   ├── ProfilesTab.tsx
│   │   │   ├── SettingsTab.tsx
│   │   │   ├── ImportExportTab.tsx
│   │   │   └── ActivityLogTab.tsx
│   │   └── modals/
│   │       ├── AddLinkModal.tsx
│   │       ├── MasterPasswordModal.tsx
│   │       └── ConfirmDeleteModal.tsx
│   ├── unlock/
│   │   ├── UnlockLayout.tsx
│   │   ├── PasswordInput.tsx
│   │   ├── DurationSelector.tsx
│   │   ├── SnoozePanel.tsx
│   │   └── CooldownDisplay.tsx
│   └── welcome/
│       ├── WelcomeSteps.tsx
│       ├── SetPasswordStep.tsx
│       └── TourStep.tsx
├── pages/
│   ├── UnlockPage.tsx
│   ├── OptionsPage.tsx
│   └── WelcomePage.tsx
├── styles/
│   ├── globals.css
│   ├── tokens.css
│   └── animations.css
└── hooks/
    ├── useToast.ts
    ├── useModal.ts
    └── useKeyboard.ts
```

---

## 🎯 Summary

This plan provides:

✅ **Complete design system** — Tokens, colors, typography  
✅ **All UI components** — Common, unlock, drawer, modals  
✅ **Responsive strategy** — Desktop, tablet, mobile  
✅ **Accessibility first** — Keyboard nav, ARIA, focus  
✅ **Clear implementation path** — 5-week phased approach

Ready to build a **dark, minimal, professional** extension UI! 🚀
