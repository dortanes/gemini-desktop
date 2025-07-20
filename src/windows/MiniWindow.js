const { BrowserWindow, app } = require('electron');
const BaseWindow = require('./BaseWindow');
const DisplayManager = require('../managers/DisplayManager');

class MiniWindow extends BaseWindow {
  constructor() {
    super();
    
    // Mini window specific configuration
    this.config = {
      ...this.config, // Inherit base config
      MINI_WINDOW: {
        WIDTH: 400,
        HEIGHT: 600,
        PADDING: {
          RIGHT: 12,
          TOP: 8,
          BOTTOM: 8
        },
        HAS_SHADOW: true,
        BACKGROUND_COLOR: "#1b1c1d"
      }
    };
  }

  create() {
    try {
      if (this.window && !this.window.isDestroyed()) {
        console.log('Mini window already exists, showing existing window');
        // If window exists, show it with slide animation
        if (!this.window.isVisible() && this.animationHandler) {
          this.animationHandler.showDrawerPanel();
        }
        return this.window;
      }

      console.log('Creating new mini window');
      
      // Use DisplayManager to get display information
      const workArea = DisplayManager.getWorkArea();
      const optimalSize = DisplayManager.getOptimalWindowSize();
      
      if (!workArea || !optimalSize) {
        console.error('Could not get display information for mini window');
        return null;
      }
      
      console.log('Work area:', workArea);
      console.log('Optimal size:', optimalSize);
      
      // Create drawer panel with optimal dimensions
      const drawerWidth = optimalSize.width;
      const drawerHeight = optimalSize.height;
      
      // Get screen bounds for positioning
      const screenBounds = DisplayManager.getScreenBounds();
      if (!screenBounds) {
        console.error('Could not get screen bounds for mini window positioning');
        return null;
      }
      
      this.window = new BrowserWindow({
        width: drawerWidth,
        height: drawerHeight, // Use validated height
        x: screenBounds.x + screenBounds.width, // Start off-screen
        y: workArea.y, // Start from work area top
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        minimizable: false,
        maximizable: false,
        movable: false, // Prevent dragging
        skipTaskbar: true,
        thickFrame: false,
        hasShadow: this.config.MINI_WINDOW.HAS_SHADOW, // Enable shadow for better visual depth
        backgroundColor: this.config.MINI_WINDOW.BACKGROUND_COLOR,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true,
          preload: this.getPreloadPath()
        },
        icon: this.getIconPath(),
        show: false
      });

      this.setupDependencies();
      this.setupEventHandlers();

      return this.window;
      
    } catch (error) {
      console.error('Error creating mini window:', error);
      // Fallback: try to show main window instead
      if (this.showMainWindowCallback) {
        this.showMainWindowCallback().catch(err => {
          console.error('Error showing main window as fallback:', err);
        });
      }
      return null;
    }
  }

  setupDependencies() {
    // Set miniWindow in TrayManager, AnimationHandler, and WebContentsViewHandler
    if (this.trayManager) {
      this.trayManager.setMiniWindow(this.window);
    }
    
    if (this.animationHandler) {
      this.animationHandler.setMiniWindow(this.window);
    }
    
    if (this.webContentsViewHandler) {
      this.webContentsViewHandler.setMiniWindow(this.window);
    }

    if (this.settingsManager) {
      this.settingsManager.setMiniWindow(this.window);
    }
  }

  setupEventHandlers() {
    if (!this.window) return;

    // Setup common event handlers from base class
    this.setupCommonEventHandlers();

    // Update tray menu when ready
    this.window.once('ready-to-show', () => {
      if (this.trayManager) {
        this.trayManager.updateTrayMenu();
      }
    });

    // Handle mini window close
    this.window.on('close', (event) => {
      if (!app.isQuiting) {
        event.preventDefault();
        if (this.animationHandler) {
          this.animationHandler.hideDrawerPanel();
        }
      }
    });

    // Hide drawer when clicking outside (blur event)
    this.window.on('blur', () => {
      // Only hide if not animating and window is visible
      if (this.animationHandler && 
          !this.animationHandler.getIsMiniWindowAnimating() && 
          this.window && 
          this.window.isVisible()) {
        console.log('Mini window lost focus, hiding drawer');
        if (this.trayManager) {
          this.trayManager.markHiddenByBlur(); // Mark that it was hidden by blur
        }
        this.animationHandler.hideDrawerPanel();
      }
    });

    // Clean up when mini window is closed
    this.window.on('closed', () => {
      console.log('Mini window closed');
      this.window = null;
      if (this.animationHandler) {
        this.animationHandler.setIsMiniWindowAnimating(false);
      }
      if (this.trayManager) {
        this.trayManager.updateTrayMenu();
      }
    });
  }

  showWindow() {
    if (!this.window || this.window.isDestroyed()) {
      this.create();
    } else {
      // If window exists, show it with slide animation
      if (!this.window.isVisible() && this.animationHandler) {
        this.animationHandler.showDrawerPanel();
      }
    }
  }

  setShowMainWindowCallback(callback) {
    this.showMainWindowCallback = callback;
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

module.exports = MiniWindow;