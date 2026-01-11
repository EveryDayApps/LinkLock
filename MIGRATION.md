# Dependency Injection Migration Guide

## What Changed

We've implemented a proper dependency injection system to manage services throughout the app. No more creating service instances with `new` in components!

## Benefits

- **Singleton services**: All services are created once and shared
- **Easy testing**: Mock services by passing them to ServiceProvider
- **Type-safe**: Full TypeScript support
- **Cleaner code**: No more service instantiation in components
- **Better architecture**: Clear dependency graph

## How to Use

### Before ❌

```tsx
import { AuthManager } from '../../lib/authManager';
import { ProfileManager } from '../../lib/profileManager';
import { useState } from 'react';

function MyComponent() {
  const [authManager] = useState(() => new AuthManager());
  const [profileManager] = useState(() => new ProfileManager());

  const handleLogin = async () => {
    await authManager.verifyMasterPassword('password');
  };

  return <div>...</div>;
}
```

### After ✅

```tsx
import { useAuthManager, useProfileManager } from '../../services';

function MyComponent() {
  const authManager = useAuthManager();
  const profileManager = useProfileManager();

  const handleLogin = async () => {
    await authManager.verifyMasterPassword('password');
  };

  return <div>...</div>;
}
```

## Available Hooks

All services are now accessible via hooks:

```tsx
import {
  useAuthManager,
  useProfileManager,
  useRuleManager,
  useRuleEvaluator,
  useUnlockSessionManager,
  useStorageService,
  usePasswordService,
  useEncryptionService,
  useDatabase,
} from '../../services';
```

## Updated Files

### Core Infrastructure
- ✅ `src/services/types.ts` - Service type definitions
- ✅ `src/services/factory.ts` - Service creation and wiring
- ✅ `src/services/ServiceContext.tsx` - React Context and hooks
- ✅ `src/services/index.ts` - Central exports

### Service Updates
- ✅ `src/lib/authManager.ts` - Accepts dependencies via constructor
- ✅ `src/lib/storage.ts` - Accepts dependencies via constructor
- ✅ `src/lib/ruleEvaluator.ts` - Fixed parameter property syntax

### Component Updates
- ✅ `src/main.tsx` - Wrapped with ServiceProvider
- ✅ `src/components/screens/SettingsScreen.tsx` - Uses useAuthManager()
- ✅ `src/components/profiles/ProfilesTab.tsx` - Uses useProfileManager()
- ✅ `src/components/screens/RulesScreen.tsx` - Uses useRuleManager() and useProfileManager()

### Background Script Updates
- ✅ `src/background/BrowserApi.ts` - Uses getServices() from factory

## Testing

You can easily mock services for testing:

```tsx
import { ServiceProvider } from '../../services';
import { render } from '@testing-library/react';

const mockServices = {
  authManager: {
    verifyMasterPassword: jest.fn().mockResolvedValue({ success: true }),
    setupMasterPassword: jest.fn(),
    // ... other methods
  },
  // ... other services
};

render(
  <ServiceProvider services={mockServices}>
    <ComponentUnderTest />
  </ServiceProvider>
);
```

## Service Dependency Graph

```
PasswordService (no deps)
EncryptionService (no deps)
    ↓
AuthManager ← PasswordService, EncryptionService
StorageService ← EncryptionService
    ↓
UnlockSessionManager (no deps)
    ↓
RuleEvaluator ← UnlockSessionManager
    ↓
ProfileManager (uses db)
RuleManager (uses localStorage)
```

All dependencies are wired automatically in the factory!

## Common Patterns

### Access a single service
```tsx
const authManager = useAuthManager();
```

### Access multiple services
```tsx
const authManager = useAuthManager();
const profileManager = useProfileManager();
```

### Access all services (rare)
```tsx
const services = useServices();
```

### In non-React code (background scripts)
```tsx
import { getServices } from '../services/factory';

const services = getServices();
const { authManager } = services;
```

## Troubleshooting

### Error: "useServices must be used within a ServiceProvider"

Make sure your app is wrapped with ServiceProvider in `main.tsx`. This has already been done:

```tsx
// src/main.tsx
<ServiceProvider>
  <App />
</ServiceProvider>
```

### Services not shared

If you're still seeing multiple instances, check that:
1. You're not creating instances with `new` anywhere
2. You're using the hooks (useAuthManager, etc.)
3. You only have one ServiceProvider in your tree

## Next Steps

All existing components have been migrated. When creating new components:

1. **Import the hook** from `../../services`
2. **Use the hook** in your component
3. **Never use `new`** to create service instances

For more details, see `src/services/README.md`
