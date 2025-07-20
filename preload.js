const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => {
      // Whitelist channels for security
      const validChannels = [
        'window-minimize',
        'window-maximize',
        'window-close',
        'open-devtools',
        'mini-window-close',
        'settings-window-close',
        'window-is-maximized',
        'toggle-fullscreen',
        'window-is-fullscreen',
        'reload-gemini',
        'go-back',
        'go-forward',
        'open-settings',
        'get-hotkey-settings',
        'save-hotkey-settings',
        'reset-hotkey-settings'
      ];
      
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
    },
    
    on: (channel, func) => {
      const validChannels = ['window-maximized', 'fullscreen-changed'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, func);
      }
    }
  }
});