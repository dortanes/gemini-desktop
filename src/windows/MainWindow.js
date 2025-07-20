const { BrowserWindow, app } = require('electron');
const BaseWindow = require('./BaseWindow');

class MainWindow extends BaseWindow {
  constructor() {
    super();
    
    // Main window specific configuration
    this.config = {
      ...this.config, // Inherit base config
      MAIN_WINDOW: {
        MIN_WIDTH: 1000,
        MIN_HEIGHT: 700,
        DEFAULT_WIDTH: 1200,
        DEFAULT_HEIGHT: 800
      }
    };
  }

  async create() {
    if (this.window && !this.window.isDestroyed()) {
      console.log('Main window already exists');
      return this.window;
    }

    console.log('Creating main window');

    // Create the browser window
    this.window = new BrowserWindow({
      width: this.config.MAIN_WINDOW.DEFAULT_WIDTH,
      height: this.config.MAIN_WINDOW.DEFAULT_HEIGHT,
      minWidth: this.config.MAIN_WINDOW.MIN_WIDTH,
      minHeight: this.config.MAIN_WINDOW.MIN_HEIGHT,
      frame: false,
      titleBarStyle: 'hidden',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        webSecurity: true,
        preload: this.getPreloadPath()
      },
      icon: this.getIconPath(),
      show: false
    });

    this.setupDependencies();
    this.setupEventHandlers();
    await this.setupWebContentsView();
    this.loadContent();

    return this.window;
  }

  setupDependencies() {
    // Set up SettingsManager with main window and callbacks
    if (this.settingsManager) {
      this.settingsManager.setMainWindow(this.window);
      this.settingsManager.setCallbacks({
        createMiniWindow: () => {
          // This will be handled by the window manager
          if (this.createMiniWindowCallback) {
            this.createMiniWindowCallback();
          }
        },
        showMainWindow: () => {
          this.show();
        },
        reloadGemini: () => {
          if (this.webContentsViewHandler) {
            this.webContentsViewHandler.reloadGemini();
          }
        }
      });
    }

    // Set up TrayManager with main window
    if (this.trayManager) {
      this.trayManager.setMainWindow(this.window);
    }

    // Set up WebContentsViewHandler with dependencies
    if (this.webContentsViewHandler) {
      this.webContentsViewHandler.setMainWindow(this.window);
      this.webContentsViewHandler.setSettingsManager(this.settingsManager);
      this.webContentsViewHandler.setAnimationHandler(this.animationHandler);
      this.webContentsViewHandler.setTrayManager(this.trayManager);
    }
  }

  setupEventHandlers() {
    if (!this.window) return;

    // Setup common event handlers from base class
    this.setupCommonEventHandlers();

    // Show window when ready to prevent visual flash
    this.window.once('ready-to-show', () => {
      this.window.show();
      if (this.trayManager) {
        this.trayManager.updateTrayMenu();
      }
    });

    // Handle window close - hide to tray instead of closing
    this.window.on('close', (event) => {
      if (!app.isQuiting) {
        event.preventDefault();
        this.window.hide();
        if (this.trayManager) {
          this.trayManager.updateTrayMenu();
          // Show notification on first minimize to tray
          this.trayManager.showTrayNotification();
        }
      }
    });

    this.window.on('minimize', () => {
      if (this.trayManager) {
        this.trayManager.updateTrayMenu();
      }
    });

    this.window.on('restore', () => {
      if (this.trayManager) {
        this.trayManager.updateTrayMenu();
      }
    });

    // Emitted when the window is closed
    this.window.on('closed', () => {
      this.window = null;
    });

    // Update maximize button when window state changes
    this.window.on('maximize', () => {
      this.window.webContents.send('window-maximized', true);
    });

    this.window.on('unmaximize', () => {
      this.window.webContents.send('window-maximized', false);
    });
  }

  async setupWebContentsView() {
    if (!this.webContentsViewHandler) return;

    // Create shared WebContentsView for Gemini content (only once)
    if (!this.webContentsViewHandler.getGeminiView()) {
      this.webContentsViewHandler.createGeminiView();
    }

    // Attach WebContentsView to main window
    try {
      await this.webContentsViewHandler.attachGeminiToMainWindow();
    } catch (error) {
      console.error('Error attaching WebContentsView to main window:', error);
    }

    // Setup resize and fullscreen handlers
    this.webContentsViewHandler.setupMainWindowResizeHandler();
    this.webContentsViewHandler.setupMainWindowFullscreenHandlers();
  }

  loadContent() {
    if (!this.window) return;

    // Load the local HTML file for the toolbar
    this.window.loadFile('index.html');
  }

  async show() {
    if (!this.window || this.window.isDestroyed()) {
      await this.create();
    } else {
      if (this.webContentsViewHandler) {
        try {
          await this.webContentsViewHandler.attachGeminiToMainWindow();
        } catch (error) {
          console.error('Error attaching WebContentsView to main window:', error);
        }
      }
      if (this.window.isMinimized()) {
        this.window.restore();
      }
      if (!this.window.isVisible()) {
        this.window.show();
      }
      this.window.focus();
    }
    if (this.trayManager) {
      this.trayManager.updateTrayMenu();
    }
  }

  setCreateMiniWindowCallback(callback) {
    this.createMiniWindowCallback = callback;
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
    return this.window && !this.window.isDestroyed() && this.window.isMaximized();
  }

  setFullScreen(fullscreen) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.setFullScreen(fullscreen);
    }
  }

  isFullScreen() {
    return this.window && !this.window.isDestroyed() && this.window.isFullScreen();
  }

  openDevTools() {
    if (this.window && !this.window.isDestroyed()) {
      if (this.window.webContents.isDevToolsOpened()) {
        this.window.webContents.closeDevTools();
      } else {
        this.window.webContents.openDevTools();
      }
    }
  }
}

module.exports = MainWindow;