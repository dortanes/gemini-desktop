const { BrowserWindow } = require('electron');
const path = require('path');

class BaseWindow {
  constructor() {
    this.window = null;
    this.trayManager = null;
    this.settingsManager = null;
    this.webContentsViewHandler = null;
    this.animationHandler = null;
    
    // Base window configuration
    this.config = {
      URLS: {
        GEMINI: 'https://gemini.google.com'
      }
    };
  }

  // Remove the setConfig method since each window class will have its own config
  setTrayManager(trayManager) {
    this.trayManager = trayManager;
  }

  setSettingsManager(settingsManager) {
    this.settingsManager = settingsManager;
  }

  setWebContentsViewHandler(webContentsViewHandler) {
    this.webContentsViewHandler = webContentsViewHandler;
  }

  setAnimationHandler(animationHandler) {
    this.animationHandler = animationHandler;
  }

  getWindow() {
    return this.window;
  }

  isDestroyed() {
    return !this.window || this.window.isDestroyed();
  }

  isVisible() {
    return this.window && this.window.isVisible();
  }

  show() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show();
    }
  }

  hide() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.hide();
    }
  }

  focus() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.focus();
    }
  }

  close() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
    }
  }

  destroy() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.destroy();
      this.window = null;
    }
  }

  minimize() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.minimize();
    }
  }

  maximize() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.maximize();
    }
  }

  unmaximize() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.unmaximize();
    }
  }

  isMaximized() {
    return this.window && !this.window.isDestroyed() ? this.window.isMaximized() : false;
  }

  toggleMaximize() {
    if (this.window && !this.window.isDestroyed()) {
      if (this.window.isMaximized()) {
        this.window.unmaximize();
      } else {
        this.window.maximize();
      }
    }
  }

  setFullscreen(fullscreen) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.setFullScreen(fullscreen);
    }
  }

  toggleFullscreen() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.setFullScreen(!this.window.isFullScreen());
    }
  }

  isFullscreen() {
    return this.window && !this.window.isDestroyed() ? this.window.isFullScreen() : false;
  }

  toggleDevTools() {
    if (this.window && !this.window.isDestroyed()) {
      if (this.window.webContents.isDevToolsOpened()) {
        this.window.webContents.closeDevTools();
      } else {
        this.window.webContents.openDevTools();
      }
    }
  }

  setupCommonEventHandlers() {
    if (!this.window) return;

    // Update tray menu when window visibility changes
    this.window.on('show', () => {
      if (this.trayManager) {
        this.trayManager.updateTrayMenu();
      }
    });

    this.window.on('hide', () => {
      if (this.trayManager) {
        this.trayManager.updateTrayMenu();
      }
    });
  }

  getIconPath() {
    return path.join(__dirname, '..', '..', 'assets', 'icon.ico');
  }

  getPreloadPath() {
    return path.join(__dirname, '..', '..', 'preload.js');
  }
}

module.exports = BaseWindow;