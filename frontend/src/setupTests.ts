import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Tauri API for tests - this runs before each test file
(window as any).__TAURI__ = {
  core: {
    invoke: vi.fn(),
  },
};
