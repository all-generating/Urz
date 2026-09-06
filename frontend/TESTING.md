# Frontend Testing Guide

## Running Tests

To run the frontend tests, use the following commands:

```bash
cd frontend
npm test           # Run tests once
npm run test:watch # Run tests in watch mode
```

## Test Coverage

The test suite (`src/App.test.tsx`) includes the following test cases:

1. **Password Generation** - Verifies that entering password and salt triggers the generation command
2. **Length Change** - Tests that changing the length slider regenerates the password
3. **Symbols Toggle** - Tests that toggling special symbols regenerates the password
4. **Copy to Clipboard** - Tests the copy functionality
5. **Empty Password Handling** - Verifies graceful handling of empty password input
6. **Multiple Input Changes** - Tests sequential changes to all inputs
7. **Error Handling** - Verifies graceful handling of backend errors

## Known Issues

### Tauri API Mocking

The tests currently fail because the `invoke` function is imported at module level in `App.tsx`:

```typescript
const invoke = window.__TAURI__?.core?.invoke || (() => Promise.resolve({ password: '' }));
```

This means the mock needs to be set up before the module is loaded. To fix this, you can:

1. **Option 1**: Refactor `App.tsx` to access `window.__TAURI__.core.invoke` directly in the function scope
2. **Option 2**: Use Vitest's `vi.hoisted` to set up the mock before module evaluation
3. **Option 3**: Create a separate module for Tauri calls that can be properly mocked

### Recommended Fix

Modify `App.tsx` to defer the invoke lookup:

```typescript
// Instead of:
const invoke = window.__TAURI__?.core?.invoke || (() => Promise.resolve({ password: '' }));

// Use in the useEffect:
const generate = async () => {
  try {
    const invoke = window.__TAURI__?.core?.invoke || (() => Promise.resolve({ password: '' }));
    const res = await invoke('generate_password_cmd', {
      req: { password, salt, length, useSymbols },
    });
    setResult((res as any)?.password || '');
  } catch (e) {
    console.error(e);
    setResult('');
  }
};
```

## Backend Tests

Rust backend tests are located in `src-tauri/src/password.rs`. To run them:

```bash
cd src-tauri
cargo test
```

The backend tests cover:
- Deterministic password generation
- Different input combinations
- Length boundary conditions
