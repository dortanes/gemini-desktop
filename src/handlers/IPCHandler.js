const { ipcMain } = require('electron');

class IPCHandler {
  constructor() {
    this.handlers = new Map();
  }

  setupHandlers({ windowManager, webContentsViewHandler, settingsManager }) {
    this.registerWindowHandlers(windowManager);
    this.registerWebContentsHandlers(webContentsViewHandler);
    this.registerSettingsHandlers(settingsManager);
  }

  registerWindowHandlers(windowManager) {
    const windowHandlers = {
      'window-minimize': () => windowManager.minimizeMainWindow(),
      'window-maximize': () => windowManager.toggleMaximizeMainWindow(),
      'window-close': () => windowManager.closeMainWindow(),
      'open-devtools': () => windowManager.toggleDevTools(),
      'mini-window-close': () => windowManager.closeMiniWindow(),
      'window-is-maximized': () => windowManager.isMainWindowMaximized(),
      'toggle-fullscreen': () => windowManager.toggleFullscreen(),
      'window-is-fullscreen': () => windowManager.isMainWindowFullscreen()
    };

    this.registerHandlers(windowHandlers);
  }

  registerWebContentsHandlers(webContentsViewHandler) {
    const webContentsHandlers = {
      'reload-gemini': () => webContentsViewHandler.reloadGemini(),
      'go-back': () => webContentsViewHandler.goBack(),
      'go-forward': () => webContentsViewHandler.goForward()
    };

    this.registerHandlers(webContentsHandlers);
  }

  registerSettingsHandlers(settingsManager) {
    const settingsHandlers = {
      'open-settings': () => settingsManager.openSettingsWindow(),
      'settings-window-close': () => settingsManager.closeSettingsWindow(),
      'get-hotkey-settings': () => settingsManager.getHotkeySettings(),
      'save-hotkey-settings': (newSettings) => settingsManager.saveHotkeySettings(newSettings),
      'reset-hotkey-settings': () => settingsManager.resetHotkeySettings()
    };

    this.registerHandlers(settingsHandlers);
  }

  registerHandlers(handlers) {
    Object.entries(handlers).forEach(([channel, handler]) => {
      if (this.handlers.has(channel)) {
        console.warn(`IPC handler for '${channel}' already exists. Removing existing handler.`);
        ipcMain.removeHandler(channel);
      }
      
      this.handlers.set(channel, handler);
      ipcMain.handle(channel, (event, ...args) => handler(...args));
    });
  }

  removeHandler(channel) {
    if (this.handlers.has(channel)) {
      ipcMain.removeHandler(channel);
      this.handlers.delete(channel);
    }
  }

  removeAllHandlers() {
    this.handlers.forEach((_, channel) => {
      ipcMain.removeHandler(channel);
    });
    this.handlers.clear();
  }

  getRegisteredChannels() {
    return Array.from(this.handlers.keys());
  }
}

module.exports = IPCHandler;