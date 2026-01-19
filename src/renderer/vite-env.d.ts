/// <reference types="vite/client" />

interface Window {
  electron: {
    versions: {
      node: () => string;
      chrome: () => string;
      electron: () => string;
    };
  };
}
