const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');

class TrayManager {
  constructor() {
    this.tray = null;
    this.mainWindow = null;
    this.miniWindow = null;
    this.geminiView = null;
    this.settingsManager = null;
    this.isMiniWindowAnimating = false;
    this.lastClickTime = 0;
    this.clickTimeout = null;
    this.recentlyHiddenByBlur = false; // Flag to track if mini window was recently hidden by blur
    
    // Callbacks for window operations
    this.createWindowCallback = null;
    this.createMiniWindowCallback = null;
    this.showDrawerPanelCallback = null;
    this.hideDrawerPanelCallback = null;
    this.hideDrawerPanelWithCallbackCallback = null;
    this.attachGeminiToMainWindowCallback = null;
    this.showMainWindowCallback = null;
  }

  setMainWindow(window) {
    this.mainWindow = window;
  }

  setMiniWindow(window) {
    this.miniWindow = window;
  }

  setGeminiView(view) {
    this.geminiView = view;
  }

  setSettingsManager(manager) {
    this.settingsManager = manager;
  }

  setMiniWindowAnimating(animating) {
    this.isMiniWindowAnimating = animating;
  }

  markHiddenByBlur() {
    this.recentlyHiddenByBlur = true;
    // Clear the flag after a short delay to allow normal tray behavior
    setTimeout(() => {
      this.recentlyHiddenByBlur = false;
    }, 500); // 500ms should be enough to prevent the race condition
  }

  setCallbacks(callbacks) {
    this.createWindowCallback = callbacks.createWindow;
    this.createMiniWindowCallback = callbacks.createMiniWindow;
    this.showDrawerPanelCallback = callbacks.showDrawerPanel;
    this.hideDrawerPanelCallback = callbacks.hideDrawerPanel;
    this.hideDrawerPanelWithCallbackCallback = callbacks.hideDrawerPanelWithCallback;
    this.attachGeminiToMainWindowCallback = callbacks.attachGeminiToMainWindow;
    this.showMainWindowCallback = callbacks.showMainWindow;
  }

  createTray() {
    // Prevent creating multiple tray instances
    if (this.tray && !this.tray.isDestroyed()) {
      console.log('Tray already exists, skipping creation');
      return;
    }

    // Create tray icon
    const iconPath = path.join(__dirname, '..', '..', 'assets', 'icon.ico');
    let trayIcon;
    
    try {
      trayIcon = nativeImage.createFromPath(iconPath);
      if (trayIcon.isEmpty()) {
        trayIcon = nativeImage.createEmpty();
      }
    } catch (error) {
      console.log('Could not load tray icon, using default');
      trayIcon = nativeImage.createEmpty();
    }
    
    this.tray = new Tray(trayIcon);
    this.tray.setToolTip('Gemini AI');
    
    // Initial menu setup
    this.updateTrayMenu();
    
    // Single click to toggle mini mode (with delay to prevent conflict with double-click)
    this.tray.on('click', () => {
      if (this.isMiniWindowAnimating) return; // Prevent clicks during mini window animation
      
      const currentTime = Date.now();
      this.lastClickTime = currentTime;
      
      // Clear any existing timeout
      if (this.clickTimeout) {
        clearTimeout(this.clickTimeout);
      }
      
      // Delay single-click action to allow double-click to override
      this.clickTimeout = setTimeout(() => {
        // Check if this is still the latest click (no double-click occurred)
        if (this.lastClickTime > 0) {
          console.log('Tray single-click: Toggling mini mode');
          
          // If mini window was recently hidden by blur, don't show it again immediately
          if (this.recentlyHiddenByBlur) {
            console.log('Mini window was recently hidden by blur, ignoring tray click');
            return;
          }
          
          // If mini window exists and is visible, hide it and return early
          if (this.miniWindow && this.miniWindow.isVisible()) {
            console.log('Mini window is visible, hiding it');
            if (this.hideDrawerPanelCallback) this.hideDrawerPanelCallback();
            this.updateTrayMenu();
            return;
          }
          
          // If main window is visible, hide it and show mini window
          if (this.mainWindow && this.mainWindow.isVisible() && !this.mainWindow.isMinimized()) {
            this.mainWindow.hide();
          }
          
          // Always show or create mini window when it's not visible
          if (this.miniWindow) {
            console.log('Mini window exists but not visible, showing it');
            if (this.showDrawerPanelCallback) this.showDrawerPanelCallback();
          } else {
            console.log('Mini window does not exist, creating and showing it');
            if (this.createMiniWindowCallback) this.createMiniWindowCallback();
            if (this.showDrawerPanelCallback) this.showDrawerPanelCallback();
          }
          
          this.updateTrayMenu();
        }
      }, 200); // Reduced delay to 200ms for better responsiveness
    });

    // Double click to show main window (and hide mini mode)
    this.tray.on('double-click', async () => {
      console.log('Tray double-click: Opening main window');
      
      // Cancel any pending single-click action
      if (this.clickTimeout) {
        clearTimeout(this.clickTimeout);
        this.clickTimeout = null;
      }
      
      // Reset click time to prevent single-click from executing
      this.lastClickTime = 0;
      
      // Function to show main window
      const showMainWindow = async () => {
        // Create main window if it doesn't exist
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {
          if (this.createWindowCallback) {
            try {
              await this.createWindowCallback();
            } catch (error) {
              console.error('Error creating main window from tray:', error);
            }
          }
          return;
        }
        
        // Move WebContentsView to main window before showing
        if (this.attachGeminiToMainWindowCallback) {
          try {
            await this.attachGeminiToMainWindowCallback();
          } catch (error) {
            console.error('Error attaching Gemini to main window from tray:', error);
          }
        }
        
        // Show and focus main window
        if (this.mainWindow.isMinimized()) {
          this.mainWindow.restore();
        }
        
        if (!this.mainWindow.isVisible()) {
          this.mainWindow.show();
        }
        
        this.mainWindow.focus();
        
        // Update menu after action
        setTimeout(() => this.updateTrayMenu(), 100);
      };
      
      // If mini window is visible, hide it first and wait for animation to complete
      if (this.miniWindow && this.miniWindow.isVisible()) {
        console.log('Hiding mini window before showing main window');
        
        // Store original callback to restore after our custom callback
        const originalCallback = async () => {
          console.log('Mini window hidden, now showing main window');
          await showMainWindow();
        };
        
        // Hide mini window with callback
        if (this.hideDrawerPanelWithCallbackCallback) {
          this.hideDrawerPanelWithCallbackCallback(originalCallback);
        }
      } else {
        // No mini window visible, show main window immediately
        await showMainWindow();
      }
    });
  }

  updateTrayMenu() {
    if (!this.tray) return;
    
    const isMainVisible = this.mainWindow && this.mainWindow.isVisible() && !this.mainWindow.isMinimized();
    const isMiniVisible = this.miniWindow && this.miniWindow.isVisible();
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: isMainVisible ? 'Hide Gemini AI' : 'Open Gemini AI',
        click: async () => {
          if (this.mainWindow) {
            if (isMainVisible) {
              this.mainWindow.hide();
            } else {
              // Hide mini window when showing main window
              if (this.miniWindow && this.miniWindow.isVisible()) {
                if (this.hideDrawerPanelCallback) this.hideDrawerPanelCallback();
              }
              // Move WebContentsView to main window
              if (this.attachGeminiToMainWindowCallback) {
                try {
                  await this.attachGeminiToMainWindowCallback();
                } catch (error) {
                  console.error('Error attaching Gemini to main window from tray menu:', error);
                }
              }
              if (this.mainWindow.isMinimized()) {
                this.mainWindow.restore();
              }
              this.mainWindow.show();
              this.mainWindow.focus();
            }
            // Update menu after action
            setTimeout(() => this.updateTrayMenu(), 100);
          } else {
            if (this.createWindowCallback) {
              try {
                await this.createWindowCallback();
              } catch (error) {
                console.error('Error creating main window from tray menu:', error);
              }
            }
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Reload Gemini',
        click: () => {
          if (this.geminiView) {
            this.geminiView.webContents.reload();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => {
          if (this.settingsManager) {
            this.settingsManager.createSettingsWindow();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    ]);
    
    this.tray.setContextMenu(contextMenu);
  }

  showTrayNotification() {
    if (this.tray && this.settingsManager && !this.settingsManager.hasShownTrayNotification()) {
      this.tray.displayBalloon({
        iconType: 'info',
        title: 'Gemini AI',
        content: 'App is running in the background. Click tray icon for mini mode, double-click for main window.'
      });
      this.settingsManager.markTrayNotificationShown();
    }
  }

  cleanup() {
    // Clean up any pending click timeout
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
    }
    
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  getTray() {
    return this.tray;
  }
}

module.exports = TrayManager;