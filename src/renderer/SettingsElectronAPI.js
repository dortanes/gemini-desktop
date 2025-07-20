class SettingsElectronAPI {
  constructor() {
    this.ipcRenderer = window.electron.ipcRenderer;
  }

  closeSettingsWindow() {
    return this.ipcRenderer.invoke('settings-window-close');
  }

  getHotkeySettings() {
    return this.ipcRenderer.invoke('get-hotkey-settings');
  }

  saveHotkeySettings(settings) {
    return this.ipcRenderer.invoke('save-hotkey-settings', settings);
  }

  resetHotkeySettings() {
    return this.ipcRenderer.invoke('reset-hotkey-settings');
  }

  invoke(channel, ...args) {
    return this.ipcRenderer.invoke(channel, ...args);
  }
}

export default SettingsElectronAPI;