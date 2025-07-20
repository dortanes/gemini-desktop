const { app } = require('electron');
const DisplayManager = require('../managers/DisplayManager');
const SettingsManager = require('../managers/SettingsManager');
const TrayManager = require('../managers/TrayManager');
const SettingsButtonHandler = require('../handlers/SettingsButtonHandler');
const AnimationHandler = require('../animation/AnimationHandler');
const WebContentsViewHandler = require('../handlers/WebContentsViewHandler');
const WindowManager = require('../windows/WindowManager');
const IPCHandler = require('../handlers/IPCHandler');

class GeminiApp {
  constructor() {
    this.clickTimeout = null;
    this.isInitialized = false;
    
    this.initializeManagers();
    this.setupEventHandlers();
  }

  initializeManagers() {
    this.animationHandler = new AnimationHandler();
    this.settingsManager = new SettingsManager(this.animationHandler);
    this.trayManager = new TrayManager();
    this.settingsButtonHandler = new SettingsButtonHandler();
    this.webContentsViewHandler = new WebContentsViewHandler();
    this.windowManager = new WindowManager();
    this.ipcHandler = new IPCHandler();
  }

  setupEventHandlers() {
    app.whenReady().then(() => this.onAppReady());
    app.on('window-all-closed', () => this.onWindowAllClosed());
    app.on('activate', () => this.onActivate());
    app.on('before-quit', () => this.onBeforeQuit());
  }

  async onAppReady() {
    if (this.isInitialized) return;
    
    // Ensure single instance
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      console.log('Another instance is already running, quitting...');
      app.quit();
      return;
    }
    
    app.on('second-instance', () => {
      // Someone tried to run a second instance, focus our main window instead
      if (this.windowManager.getMainWindow()) {
        const mainWindow = this.windowManager.getMainWindow();
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
    
    DisplayManager.logDisplayInfo();
    await this.settingsManager.loadSettings();
    
    this.setupDependencies();
    this.setupIPC();
    
    await this.windowManager.createMiniWindow();
    await this.windowManager.createMainWindow();
    
    this.isInitialized = true;
  }

  setupDependencies() {
    this.windowManager.setTrayManager(this.trayManager);
    this.windowManager.setSettingsManager(this.settingsManager);
    this.windowManager.setWebContentsViewHandler(this.webContentsViewHandler);
    this.windowManager.setAnimationHandler(this.animationHandler);
    this.windowManager.setSettingsButtonHandler(this.settingsButtonHandler);
    
    this.settingsManager.setWebContentsViewHandler(this.webContentsViewHandler);
    
    this.animationHandler.setDisplayManager(DisplayManager);
    this.animationHandler.setTrayManager(this.trayManager);
    this.animationHandler.setSettingsManager(this.settingsManager);
    this.animationHandler.setCallbacks({
      updateMiniBrowserViewBounds: () => this.webContentsViewHandler.updateMiniBrowserViewBounds(),
      attachGeminiToMiniWindow: async () => {
        try {
          return await this.webContentsViewHandler.attachGeminiToMiniWindow();
        } catch (error) {
          console.error('Error attaching Gemini to mini window:', error);
          return false;
        }
      },
      updateTrayMenu: () => this.trayManager.updateTrayMenu()
    });
    
    this.trayManager.setSettingsManager(this.settingsManager);
    this.trayManager.setCallbacks({
      createWindow: async () => {
        try {
          await this.windowManager.createMainWindow();
        } catch (error) {
          console.error('Error creating main window:', error);
        }
      },
      createMiniWindow: () => this.windowManager.showMiniWindow(),
      showDrawerPanel: () => this.animationHandler.showDrawerPanel(),
      hideDrawerPanel: () => this.animationHandler.hideDrawerPanel(),
      hideDrawerPanelWithCallback: (callback) => this.animationHandler.hideDrawerPanelWithCallback(callback),
      attachGeminiToMainWindow: async () => {
        try {
          await this.webContentsViewHandler.attachGeminiToMainWindow();
        } catch (error) {
          console.error('Error attaching Gemini to main window:', error);
        }
      },
      showMainWindow: async () => {
        try {
          await this.windowManager.showMainWindow();
        } catch (error) {
          console.error('Error showing main window:', error);
        }
      }
    });
    this.trayManager.createTray();
    
    this.settingsManager.setCallbacks({
      createMiniWindow: () => this.windowManager.showMiniWindow(),
      showMainWindow: async () => {
        try {
          await this.windowManager.showMainWindow();
        } catch (error) {
          console.error('Error showing main window:', error);
        }
      },
      reloadGemini: () => this.webContentsViewHandler.reloadGemini()
    });
    
    this.settingsManager.registerGlobalShortcuts();
  }

  setupIPC() {
    this.ipcHandler.setupHandlers({
      windowManager: this.windowManager,
      webContentsViewHandler: this.webContentsViewHandler,
      settingsManager: this.settingsManager
    });
  }

  onBeforeQuit() {
    console.log('App is about to quit, performing cleanup...');
    app.isQuiting = true;
    this.cleanup();
  }

  onWindowAllClosed() {
    this.cleanup();
    
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  async onActivate() {
    if (this.windowManager.getMainWindow() === null) {
      try {
        await this.windowManager.createMainWindow();
      } catch (error) {
        console.error('Error creating main window on activate:', error);
      }
    }
  }

  cleanup() {
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
    }
    
    this.settingsManager?.cleanup();
    this.trayManager?.cleanup();
  }

  async start() {
    if (this.isInitialized) {
      console.log('App already initialized, skipping start');
      return;
    }
    
    if (!app.isReady()) {
      await app.whenReady();
    }
    return this.onAppReady();
  }
}

module.exports = GeminiApp;