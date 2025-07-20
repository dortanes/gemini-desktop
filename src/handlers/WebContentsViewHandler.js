const { WebContentsView, shell } = require('electron');
const path = require('path');
const WebContentsViewStateManager = require('../managers/WebContentsViewStateManager');

class WebContentsViewHandler {
  constructor() {
    this.geminiView = null;
    this.mainWindow = null;
    this.miniWindow = null;
    this.currentAttachedWindow = null;
    this.settingsManager = null;
    this.animationHandler = null;
    this.settingsButtonHandler = null;
    this.trayManager = null;
    this.stateManager = new WebContentsViewStateManager();
    
    // Setup state change listener
    this.stateManager.addStateChangeListener((oldState, newState) => {
      this.onStateChange(oldState, newState);
    });
  }

  // Setters for dependencies
  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  setMiniWindow(miniWindow) {
    this.miniWindow = miniWindow;
  }

  setSettingsManager(settingsManager) {
    this.settingsManager = settingsManager;
  }

  setAnimationHandler(animationHandler) {
    this.animationHandler = animationHandler;
  }

  setSettingsButtonHandler(settingsButtonHandler) {
    this.settingsButtonHandler = settingsButtonHandler;
  }

  setTrayManager(trayManager) {
    this.trayManager = trayManager;
  }

  // Get the current WebContentsView
  getGeminiView() {
    return this.geminiView;
  }

  // Get the current attached window
  getCurrentAttachedWindow() {
    return this.currentAttachedWindow;
  }

  // Check if currently transitioning between windows
  isCurrentlyTransitioning() {
    return this.stateManager.isTransitioning();
  }

  // Get current state
  getCurrentState() {
    return this.stateManager.getCurrentState();
  }

  // Handle state changes
  onStateChange(oldState, newState) {
    // Update currentAttachedWindow based on state
    switch (newState) {
      case 'main':
        this.currentAttachedWindow = this.mainWindow;
        break;
      case 'mini':
        this.currentAttachedWindow = this.miniWindow;
        break;
      case 'detached':
      case 'transitioning':
        // Don't change currentAttachedWindow during transition
        if (newState === 'detached') {
          this.currentAttachedWindow = null;
        }
        break;
    }

    // Notify animation handler of state changes
    if (this.animationHandler) {
      this.animationHandler.setCurrentAttachedWindow(this.currentAttachedWindow);
    }
  }

  // Create the shared WebContentsView for Gemini content
  createGeminiView() {
    if (this.geminiView) {
      console.log('Gemini WebContentsView already exists');
      return this.geminiView;
    }

    console.log('Creating Gemini WebContentsView');
    
    this.geminiView = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false, // Disable web security to allow HTML injection
        additionalArguments: [
          '--disable-features=VizDisplayCompositor',
          '--disable-web-security',
          '--disable-features=TrustedTypes'
        ]
      }
    });

    // Set transparent background (WebContentsView defaults to white)
    this.geminiView.setBackgroundColor("#00000000");

    // Set geminiView in dependent handlers
    if (this.trayManager) {
      this.trayManager.setGeminiView(this.geminiView);
    }
    if (this.animationHandler) {
      this.animationHandler.setGeminiView(this.geminiView);
    }
    if (this.settingsButtonHandler) {
      this.settingsButtonHandler.setGeminiView(this.geminiView);
      this.settingsButtonHandler.setSettingsManager(this.settingsManager);
      this.settingsButtonHandler.initialize();
    }

    // Load Gemini in the WebContentsView
    this.geminiView.webContents.loadURL('https://gemini.google.com');

    // Handle external links in the WebContentsView
    this.geminiView.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    return this.geminiView;
  }

  // Function to safely remove WebContentsView from a window
  async safeWebContentsViewRemoval(window, webContentsView) {
    if (!window || !webContentsView) return Promise.resolve();
    
    return new Promise((resolve) => {
      try {
        // Check if the window still exists and has the WebContentsView
        if (window.contentView && window.contentView.children.includes(webContentsView)) {
          window.contentView.removeChildView(webContentsView);
          console.log('WebContentsView successfully removed from window');
        }
        // Small delay to ensure removal is processed
        setTimeout(resolve, 10);
      } catch (error) {
        console.error('Error removing WebContentsView:', error);
        setTimeout(resolve, 10);
      }
    });
  }

  // Function to safely add WebContentsView to a window
  async safeWebContentsViewAddition(window, webContentsView) {
    if (!window || !webContentsView) return false;
    
    return new Promise((resolve) => {
      try {
        // Check if the window doesn't already have the WebContentsView
        if (!window.contentView.children.includes(webContentsView)) {
          window.contentView.addChildView(webContentsView);
          console.log('WebContentsView successfully added to window');
        }
        // Small delay to ensure addition is processed
        setTimeout(() => resolve(true), 10);
      } catch (error) {
        console.error('Error adding WebContentsView:', error);
        setTimeout(() => resolve(false), 10);
      }
    });
  }

  // Function to attach Gemini WebContentsView to main window
  async attachGeminiToMainWindow() {
    if (!this.geminiView || !this.mainWindow || this.mainWindow.isDestroyed()) {
      console.warn('Cannot attach Gemini to main window: missing components');
      return false;
    }

    return await this.stateManager.requestTransition('main', async () => {
      console.log('Executing transition to main window');
      
      // Remove from current window if attached elsewhere
      if (this.currentAttachedWindow && this.currentAttachedWindow !== this.mainWindow) {
        console.log('Removing WebContentsView from current window');
        await this.safeWebContentsViewRemoval(this.currentAttachedWindow, this.geminiView);
      }
      
      // Attach to main window
      const success = await this.safeWebContentsViewAddition(this.mainWindow, this.geminiView);
      if (success) {
        console.log('WebContentsView successfully attached to main window');
        
        // Set geminiView in SettingsManager
        if (this.settingsManager) {
          this.settingsManager.setGeminiView(this.geminiView);
        }
        
        // Update bounds with proper timing
        setTimeout(() => {
          this.updateMainBrowserViewBounds();
        }, 50);
        
        return true;
      } else {
        console.error('Failed to attach WebContentsView to main window');
        throw new Error('Failed to attach WebContentsView to main window');
      }
    });
  }

  // Function to attach Gemini WebContentsView to mini window
  async attachGeminiToMiniWindow() {
    if (!this.geminiView || !this.miniWindow) {
      console.warn('Cannot attach Gemini to mini window: missing components');
      return false;
    }

    return await this.stateManager.requestTransition('mini', async () => {
      console.log('Executing transition to mini window');
      
      // Remove from current window if attached elsewhere
      if (this.currentAttachedWindow && this.currentAttachedWindow !== this.miniWindow) {
        console.log('Removing WebContentsView from current window');
        await this.safeWebContentsViewRemoval(this.currentAttachedWindow, this.geminiView);
      }
      
      // Attach to mini window
      const success = await this.safeWebContentsViewAddition(this.miniWindow, this.geminiView);
      if (success) {
        console.log('WebContentsView successfully attached to mini window');
        
        // Update bounds with proper timing
        setTimeout(() => {
          this.updateMiniBrowserViewBounds();
        }, 50);
        
        // Ensure content visibility with proper timing
        setTimeout(() => {
          if (this.geminiView.webContents && !this.geminiView.webContents.isDestroyed()) {
            this.geminiView.webContents.invalidate();
            this.geminiView.webContents.executeJavaScript('window.dispatchEvent(new Event("resize"));').catch(() => {});
          }
        }, 100);
        
        return true;
      } else {
        console.error('Failed to attach WebContentsView to mini window');
        throw new Error('Failed to attach WebContentsView to mini window');
      }
    });
  }

  // Function to update main window WebContentsView bounds
  updateMainBrowserViewBounds() {
    if (!this.geminiView || !this.mainWindow || this.currentAttachedWindow !== this.mainWindow) return;
    
    try {
      const bounds = this.mainWindow.getBounds();
      const isFullScreen = this.mainWindow.isFullScreen();
      const toolbarHeight = isFullScreen ? 0 : 41;
      
      const newBounds = {
        x: 0,
        y: toolbarHeight,
        width: bounds.width,
        height: bounds.height - toolbarHeight
      };
      
      console.log('Setting main window WebContentsView bounds:', newBounds);
      this.geminiView.setBounds(newBounds);
    } catch (error) {
      console.error('Error updating main browser view bounds:', error);
    }
  }

  // Function to update mini window WebContentsView bounds
  updateMiniBrowserViewBounds() {
    if (!this.geminiView || !this.miniWindow || this.currentAttachedWindow !== this.miniWindow) return;
    
    try {
      const bounds = this.miniWindow.getBounds();
      // Get padding from the mini window's config
      const padding = {
        RIGHT: 12,
        TOP: 8,
        BOTTOM: 8
      };
      
      const newBounds = {
        x: 0,
        y: padding.TOP,
        width: bounds.width - padding.RIGHT,
        height: bounds.height - padding.TOP - padding.BOTTOM
      };
      
      console.log('Setting mini window WebContentsView bounds with padding:', newBounds);
      
      // Set bounds and force immediate update
      this.geminiView.setBounds(newBounds);
      
      // Force the webContents to acknowledge the new size with multiple methods
      if (this.geminiView.webContents && !this.geminiView.webContents.isDestroyed()) {
        // Method 1: Invalidate the view
        this.geminiView.webContents.invalidate();
        
        // Method 2: Force a repaint
        setTimeout(() => {
          if (this.geminiView.webContents && !this.geminiView.webContents.isDestroyed()) {
            this.geminiView.webContents.executeJavaScript(`
              // Force DOM reflow and repaint
              document.body.style.display = 'none';
              document.body.offsetHeight; // Trigger reflow
              document.body.style.display = '';
              
              // Dispatch resize event
              window.dispatchEvent(new Event('resize'));
            `).catch(() => {});
          }
        }, 20);
        
        // Method 3: Additional invalidation after a short delay
        setTimeout(() => {
          if (this.geminiView.webContents && !this.geminiView.webContents.isDestroyed()) {
            this.geminiView.webContents.invalidate();
          }
        }, 50);
      }
      
    } catch (error) {
      console.error('Error updating mini browser view bounds:', error);
    }
  }

  // Navigation controls
  reloadGemini() {
    if (this.geminiView) {
      this.geminiView.webContents.reload();
    }
  }

  goBack() {
    if (this.geminiView && this.geminiView.webContents.canGoBack()) {
      this.geminiView.webContents.goBack();
    }
  }

  goForward() {
    if (this.geminiView && this.geminiView.webContents.canGoForward()) {
      this.geminiView.webContents.goForward();
    }
  }

  // DevTools controls
  toggleDevTools() {
    if (this.geminiView) {
      if (this.geminiView.webContents.isDevToolsOpened()) {
        this.geminiView.webContents.closeDevTools();
      } else {
        this.geminiView.webContents.openDevTools();
      }
    }
  }

  // Setup resize handler for main window
  setupMainWindowResizeHandler() {
    if (!this.mainWindow) return;

    this.mainWindow.on('resize', () => {
      if (!this.mainWindow || !this.geminiView || this.currentAttachedWindow !== this.mainWindow) {
        return;
      }
      this.updateMainBrowserViewBounds();
    });
  }

  // Setup fullscreen handlers for main window
  setupMainWindowFullscreenHandlers() {
    if (!this.mainWindow) return;

    this.mainWindow.on('enter-full-screen', () => {
      this.mainWindow.webContents.send('fullscreen-changed', true);
      this.updateMainBrowserViewBounds();
    });

    this.mainWindow.on('leave-full-screen', () => {
      this.mainWindow.webContents.send('fullscreen-changed', false);
      this.updateMainBrowserViewBounds();
    });
  }

  // Cleanup method
  cleanup() {
    console.log('Cleaning up WebContentsViewHandler');
    this.stateManager.forceReset();
    
    if (this.geminiView && this.currentAttachedWindow) {
      try {
        this.currentAttachedWindow.contentView.removeChildView(this.geminiView);
      } catch (error) {
        console.error('Error during cleanup removal:', error);
      }
    }
    
    this.currentAttachedWindow = null;
    this.geminiView = null;
    this.mainWindow = null;
    this.miniWindow = null;
    this.animationHandler = null;
  }
}

module.exports = WebContentsViewHandler;