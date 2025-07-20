class AnimationHandler {
  constructor() {
    this.isMiniWindowAnimating = false;
    this.miniWindow = null;
    this.geminiView = null;
    this.currentAttachedWindow = null;
    this.trayManager = null;
    this.displayManager = null;
    this.settingsManager = null;
    
    // Animation configuration
    this.config = {
      DURATION: 200, // Animation duration in ms
      EASING_FACTOR: 0.15, // Easing factor for smooth animation
      MIN_REFRESH_RATE: 60, // Minimum refresh rate fallback
      PREFERRED_REFRESH_RATE: 120, // Preferred refresh rate fallback
    };
    
    // Callbacks
    this.updateMiniBrowserViewBoundsCallback = null;
    this.attachGeminiToMiniWindowCallback = null;
    this.updateTrayMenuCallback = null;
  }

  setMiniWindow(miniWindow) {
    this.miniWindow = miniWindow;
  }

  setGeminiView(geminiView) {
    this.geminiView = geminiView;
  }

  setCurrentAttachedWindow(currentAttachedWindow) {
    this.currentAttachedWindow = currentAttachedWindow;
  }

  setTrayManager(trayManager) {
    this.trayManager = trayManager;
  }

  setDisplayManager(displayManager) {
    this.displayManager = displayManager;
  }

  setSettingsManager(settingsManager) {
    this.settingsManager = settingsManager;
  }

  setCallbacks(callbacks) {
    this.updateMiniBrowserViewBoundsCallback = callbacks.updateMiniBrowserViewBounds;
    this.attachGeminiToMiniWindowCallback = callbacks.attachGeminiToMiniWindow;
    this.updateTrayMenuCallback = callbacks.updateTrayMenu;
  }

  getIsMiniWindowVisible() {
    return this.miniWindow ? this.miniWindow.isVisible() : false;
  }

  getIsMiniWindowAnimating() {
    return this.isMiniWindowAnimating;
  }

  setIsMiniWindowAnimating(animating) {
    this.isMiniWindowAnimating = animating;
    if (this.trayManager && this.trayManager.setMiniWindowAnimating) {
      this.trayManager.setMiniWindowAnimating(animating);
    }
  }

  /**
   * Easing function - ease out cubic for smooth animation
   * @param {number} t - Progress value between 0 and 1
   * @returns {number} Eased progress value
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Animates drawer movement with smooth easing and dynamic refresh rate synchronization
   * @param {number} startX - Starting X position
   * @param {number} endX - Target X position
   * @param {number} y - Y position to maintain during animation
   * @param {boolean} isShowing - Whether the drawer is being shown or hidden
   */
  animateDrawerWithEasing(startX, endX, y, isShowing) {
    this.animateDrawerWithEasingAndCallback(startX, endX, y, isShowing, null);
  }

  /**
   * Animates drawer movement with smooth easing, dynamic refresh rate synchronization and callback
   * @param {number} startX - Starting X position
   * @param {number} endX - Target X position
   * @param {number} y - Y position to maintain during animation
   * @param {boolean} isShowing - Whether the drawer is being shown or hidden
   * @param {Function} [callback] - Optional callback when animation completes
   */
  animateDrawerWithEasingAndCallback(startX, endX, y, isShowing, callback) {
    const duration = this.config.DURATION;
    const startTime = Date.now();
    
    // Get actual display refresh rate for smoother animation
    const displayRefreshRate = this.displayManager.getDisplayRefreshRate();
    const frameInterval = this.displayManager.getFrameInterval();
    let lastFrameTime = startTime;
    
    console.log(`Animation using ${displayRefreshRate}Hz refresh rate (${frameInterval.toFixed(2)}ms per frame)`);
    
    const animate = () => {
      if (!this.miniWindow) {
        this.setIsMiniWindowAnimating(false);
        if (callback) callback();
        return;
      }
      
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing function
      const easedProgress = this.easeOutCubic(progress);
      
      // Calculate current position
      const currentX = startX + (endX - startX) * easedProgress;
      
      // Simple position update - just move the window, no resizing needed
      try {
        this.miniWindow.setPosition(Math.round(currentX), y);
      } catch (error) {
        console.error('Error setting position during animation:', error);
        this.setIsMiniWindowAnimating(false);
        if (callback) callback();
        return;
      }
      
      if (progress < 1) {
        // Frame rate limiting based on actual display refresh rate
        const timeSinceLastFrame = currentTime - lastFrameTime;
        const timeToNextFrame = Math.max(0, frameInterval - timeSinceLastFrame);
        
        setTimeout(() => {
          lastFrameTime = Date.now();
          animate();
        }, timeToNextFrame);
      } else {
        // Animation complete
        this.setIsMiniWindowAnimating(false);
        if (!isShowing) {
          this.miniWindow.hide();
          if (this.trayManager) this.trayManager.updateTrayMenu();
        } else {
          // Only one final bounds update to ensure proper positioning
          if (this.currentAttachedWindow === this.miniWindow && this.geminiView) {
            if (this.updateMiniBrowserViewBoundsCallback) {
              this.updateMiniBrowserViewBoundsCallback();
            }
          }
          if (this.trayManager) this.trayManager.updateTrayMenu();
        }
        
        // Execute callback if provided
        if (callback) {
          setTimeout(callback, 50); // Small delay to ensure UI updates are complete
        }
      }
    };
    
    // Start animation
    animate();
  }

  /**
   * Shows drawer panel with slide animation
   */
  async showDrawerPanel() {
    if (!this.miniWindow || this.isMiniWindowAnimating) return;

    console.log('Starting drawer panel animation, isMiniWindowAnimating:', this.isMiniWindowAnimating);
    
    // Focus mini window
    this.miniWindow.focus();

    this.setIsMiniWindowAnimating(true);
    const drawerWidth = 400;
    
    // Use DisplayManager to get display information
    const workArea = this.displayManager.getWorkArea();
    const drawerPosition = this.displayManager.calculateDrawerPosition(drawerWidth);
    
    if (!workArea || !drawerPosition) {
      console.error('Could not get display information for drawer panel');
      this.setIsMiniWindowAnimating(false);
      return;
    }
    
    // Use work area to respect taskbar
    const availableHeight = workArea.height;
    const availableY = workArea.y;
    
    // Final position (visible) and start position (off-screen)
    const finalX = drawerPosition.x;
    const finalY = availableY;
    const startX = drawerPosition.startX;
    
    // Set initial position
    this.miniWindow.setBounds({
      x: startX,
      y: finalY,
      width: drawerWidth,
      height: availableHeight
    });
    
    // Show the window first
    this.miniWindow.show();
    
    // Force maximum priority and try to override taskbar
    this.miniWindow.setAlwaysOnTop(true, 'pop-up-menu', 1);
    
    // Attach WebContentsView AFTER showing the window for better synchronization
    if (this.attachGeminiToMiniWindowCallback) {
      try {
        const success = await this.attachGeminiToMiniWindowCallback();
        if (!success) {
          console.error('Failed to attach WebContentsView to mini window');
          this.setIsMiniWindowAnimating(false);
          return;
        }
      } catch (error) {
        console.error('Error attaching WebContentsView to mini window:', error);
        this.setIsMiniWindowAnimating(false);
        return;
      }
    }

    // Wait for WebContentsView to be properly attached before starting animation
    setTimeout(() => {
      // Ensure WebContentsView is properly positioned before animation
      if (this.currentAttachedWindow === this.miniWindow && this.geminiView) {
        if (this.updateMiniBrowserViewBoundsCallback) {
          this.updateMiniBrowserViewBoundsCallback();
        }
      }
      
      // Start animation after ensuring everything is ready
      setTimeout(() => {
        this.animateDrawerWithEasing(startX, finalX, finalY, true);
      }, 150);
    }, 100);
  }

  /**
   * Hides drawer panel with slide animation
   */
  hideDrawerPanel() {
    this.hideDrawerPanelWithCallback(null);
  }

  /**
   * Hides drawer panel with slide animation and callback
   * @param {Function} [callback] - Optional callback when animation completes
   */
  hideDrawerPanelWithCallback(callback) {
    if (!this.miniWindow || !this.miniWindow.isVisible() || this.isMiniWindowAnimating) {
      if (callback) callback();
      return;
    }

    // Stop voice mode if it's active when drawer is being hidden
    if (this.settingsManager && this.settingsManager.voiceModeActive) {
      console.log('Drawer closing, stopping voice mode');
      this.settingsManager.stopVoiceMode();
    }

    this.setIsMiniWindowAnimating(true);
    
    // Use DisplayManager to get screen bounds
    const screenBounds = this.displayManager.getScreenBounds();
    if (!screenBounds) {
      console.error('Could not get screen bounds for hiding drawer panel');
      this.setIsMiniWindowAnimating(false);
      if (callback) callback();
      return;
    }
    
    // Current position
    const currentBounds = this.miniWindow.getBounds();
    const startX = currentBounds.x;
    const finalX = screenBounds.x + screenBounds.width; // Off-screen to the right
    const y = currentBounds.y;
    
    // Animate slide out with easing and callback
    this.animateDrawerWithEasingAndCallback(startX, finalX, y, false, callback);
  }
}

module.exports = AnimationHandler;