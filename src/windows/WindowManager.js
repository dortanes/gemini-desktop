const MainWindow = require('./MainWindow');
const MiniWindow = require('./MiniWindow');

class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.miniWindow = null;
    this.trayManager = null;
    this.settingsManager = null;
    this.webContentsViewHandler = null;
    this.animationHandler = null;
    this.settingsButtonHandler = null;
  }

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

  setSettingsButtonHandler(settingsButtonHandler) {
    this.settingsButtonHandler = settingsButtonHandler;
  }

  async createMainWindow() {
    if (!this.mainWindow) {
      this.mainWindow = new MainWindow();
      this.mainWindow.setTrayManager(this.trayManager);
      this.mainWindow.setSettingsManager(this.settingsManager);
      this.mainWindow.setWebContentsViewHandler(this.webContentsViewHandler);
      this.mainWindow.setAnimationHandler(this.animationHandler);
      this.mainWindow.setCreateMiniWindowCallback(() => this.createMiniWindow());
      
      // Set up WebContentsViewHandler with SettingsButtonHandler
      if (this.webContentsViewHandler && this.settingsButtonHandler) {
        this.webContentsViewHandler.setSettingsButtonHandler(this.settingsButtonHandler);
      }
    }

    return await this.mainWindow.create();
  }

  createMiniWindow() {
    if (!this.miniWindow) {
      this.miniWindow = new MiniWindow();
      this.miniWindow.setTrayManager(this.trayManager);
      this.miniWindow.setWebContentsViewHandler(this.webContentsViewHandler);
      this.miniWindow.setAnimationHandler(this.animationHandler);
      this.miniWindow.setShowMainWindowCallback(async () => {
        try {
          await this.showMainWindow();
        } catch (error) {
          console.error('Error showing main window from mini window callback:', error);
        }
      });
    }

    return this.miniWindow.create();
  }

  async showMainWindow() {
    // Hide mini window if visible
    if (this.miniWindow && this.miniWindow.isVisible()) {
      if (this.animationHandler) {
        this.animationHandler.hideDrawerPanel();
      }
    }

    if (!this.mainWindow) {
      await this.createMainWindow();
    } else {
      await this.mainWindow.show();
    }
  }

  showMiniWindow() {
    this.mainWindow.hide();
    
    if (!this.miniWindow) {
      this.createMiniWindow();
    }
    
    // Ensure animation handler has the mini window reference
    if (this.animationHandler && this.miniWindow) {
      this.animationHandler.setMiniWindow(this.miniWindow.getWindow());
    }
    
    this.miniWindow.showWindow();
  }

  getMainWindow() {
    return this.mainWindow ? this.mainWindow.getWindow() : null;
  }

  getMiniWindow() {
    return this.miniWindow ? this.miniWindow.getWindow() : null;
  }

  getMainWindowInstance() {
    return this.mainWindow;
  }

  getMiniWindowInstance() {
    return this.miniWindow;
  }

  // Window control methods for IPC handlers
  minimizeMainWindow() {
    if (this.mainWindow) {
      this.mainWindow.minimize();
    }
  }

  toggleMaximizeMainWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
    }
  }

  closeMainWindow() {
    if (this.mainWindow) {
      this.mainWindow.close();
    }
  }

  closeMiniWindow() {
    if (this.miniWindow) {
      this.miniWindow.close();
      this.miniWindow.destroy();
      this.miniWindow = null;
    }
  }

  isMainWindowMaximized() {
    return this.mainWindow ? this.mainWindow.isMaximized() : false;
  }

  toggleFullscreen() {
    if (this.mainWindow) {
      const isFullscreen = this.mainWindow.isFullScreen();
      this.mainWindow.setFullScreen(!isFullscreen);
    }
  }

  isMainWindowFullscreen() {
    return this.mainWindow ? this.mainWindow.isFullScreen() : false;
  }

  toggleDevTools() {
    if (this.mainWindow) {
      this.mainWindow.openDevTools();
    }
    if (this.miniWindow) {
      this.miniWindow.openDevTools();
    }
    if (this.webContentsViewHandler) {
      this.webContentsViewHandler.toggleDevTools();
    }
  }
}

module.exports = WindowManager;