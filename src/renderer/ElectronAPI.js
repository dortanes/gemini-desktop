export default class ElectronAPI {
  constructor() {
    this.ipcRenderer = window.electron?.ipcRenderer;
  }

  async minimizeWindow() {
    return this.invoke('window-minimize');
  }

  async maximizeWindow() {
    return this.invoke('window-maximize');
  }

  async closeWindow() {
    return this.invoke('window-close');
  }

  async openDevtools() {
    return this.invoke('open-devtools');
  }

  async openSettings() {
    return this.invoke('open-settings');
  }

  async isMaximized() {
    return this.invoke('window-is-maximized');
  }

  async toggleFullscreen() {
    return this.invoke('toggle-fullscreen');
  }

  async isFullscreen() {
    return this.invoke('window-is-fullscreen');
  }

  async reloadGemini() {
    return this.invoke('reload-gemini');
  }

  async goBack() {
    return this.invoke('go-back');
  }

  async goForward() {
    return this.invoke('go-forward');
  }

  async invoke(channel, ...args) {
    if (!this.ipcRenderer) {
      throw new Error('IPC Renderer not available');
    }
    return this.ipcRenderer.invoke(channel, ...args);
  }

  on(channel, listener) {
    if (this.ipcRenderer) {
      this.ipcRenderer.on(channel, listener);
    }
  }

  removeListener(channel, listener) {
    if (this.ipcRenderer) {
      this.ipcRenderer.removeListener(channel, listener);
    }
  }
}
