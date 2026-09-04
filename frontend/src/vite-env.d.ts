/// <reference types="vite/client" />

declare module '@tauri-apps/api/core' {
  export function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T>;
}

interface Window {
  __TAURI__: {
    core: {
      invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T>;
    };
    clipboard: {
      writeText(text: string): Promise<void>;
    };
  };
}
