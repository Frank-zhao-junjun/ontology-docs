import '@testing-library/jest-dom';

// Polyfill ResizeObserver for JSDOM (needed by antd Layout.Sider)
if (typeof ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
