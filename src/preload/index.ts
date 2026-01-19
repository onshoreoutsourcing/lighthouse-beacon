import { contextBridge } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Placeholder API - will be expanded in future waves
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
  },
});

// Log to confirm preload script is running
// eslint-disable-next-line no-console
console.log('Preload script loaded successfully');
