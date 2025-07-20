const { screen } = require('electron');

/**
 * DisplayManager - Static class for handling display-related operations
 * Manages screen information, refresh rates, and display calculations
 */
class DisplayManager {
  /**
   * Configuration constants for display operations
   */
  static CONFIG = {
    ANIMATION: {
      MIN_REFRESH_RATE: 60,
      PREFERRED_REFRESH_RATE: 120,
    }
  };

  /**
   * Detects the primary display's refresh rate with intelligent fallbacks
   * @returns {number} Refresh rate in Hz (60-240 typical range)
   */
  static getDisplayRefreshRate() {
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      // Electron provides displayFrequency in some versions
      if (primaryDisplay.displayFrequency) {
        console.log('Display refresh rate detected:', primaryDisplay.displayFrequency, 'Hz');
        return primaryDisplay.displayFrequency;
      }
      
      // Fallback: try to detect from internal display info
      const displays = screen.getAllDisplays();
      for (const display of displays) {
        if (display.internal && display.displayFrequency) {
          console.log('Internal display refresh rate detected:', display.displayFrequency, 'Hz');
          return display.displayFrequency;
        }
      }
      
      // If no refresh rate detected, use common high refresh rates as fallback
      console.log(`Could not detect refresh rate, using ${this.CONFIG.ANIMATION.PREFERRED_REFRESH_RATE}Hz fallback`);
      return this.CONFIG.ANIMATION.PREFERRED_REFRESH_RATE; // Better fallback for modern monitors
    } catch (error) {
      console.error('Error detecting refresh rate:', error);
      return this.CONFIG.ANIMATION.MIN_REFRESH_RATE; // Safe fallback
    }
  }

  /**
   * Gets the primary display information
   * @returns {Object} Primary display object with bounds and work area
   */
  static getPrimaryDisplay() {
    try {
      return screen.getPrimaryDisplay();
    } catch (error) {
      console.error('Error getting primary display:', error);
      return null;
    }
  }

  /**
   * Gets all available displays
   * @returns {Array} Array of display objects
   */
  static getAllDisplays() {
    try {
      return screen.getAllDisplays();
    } catch (error) {
      console.error('Error getting all displays:', error);
      return [];
    }
  }

  /**
   * Gets screen bounds for the primary display
   * @returns {Object|null} Screen bounds object or null if error
   */
  static getScreenBounds() {
    const primaryDisplay = this.getPrimaryDisplay();
    return primaryDisplay ? primaryDisplay.bounds : null;
  }

  /**
   * Gets work area for the primary display (excludes taskbar)
   * @returns {Object|null} Work area object or null if error
   */
  static getWorkArea() {
    const primaryDisplay = this.getPrimaryDisplay();
    return primaryDisplay ? primaryDisplay.workArea : null;
  }

  /**
   * Calculates taskbar height based on screen bounds and work area
   * @returns {number} Taskbar height in pixels
   */
  static getTaskbarHeight() {
    const screenBounds = this.getScreenBounds();
    const workArea = this.getWorkArea();
    
    if (!screenBounds || !workArea) {
      return 0;
    }
    
    return screenBounds.height - workArea.height;
  }

  /**
   * Validates if screen dimensions are sufficient for given window size
   * @param {number} requiredWidth - Required window width
   * @param {number} requiredHeight - Required window height
   * @returns {boolean} True if screen is large enough
   */
  static validateScreenSize(requiredWidth, requiredHeight) {
    const workArea = this.getWorkArea();
    
    if (!workArea) {
      return false;
    }
    
    return workArea.width >= requiredWidth && workArea.height >= requiredHeight;
  }

  /**
   * Gets optimal window size for mini window based on work area
   * @returns {Object} Object with width and height properties
   */
  static getOptimalWindowSize() {
    const workArea = this.getWorkArea();
    const screenBounds = this.getScreenBounds();
    
    if (!workArea || !screenBounds) {
      return { width: 400, height: 600 }; // Default fallback
    }
    
    // Use work area to respect taskbar
    const availableHeight = workArea.height;
    const drawerWidth = Math.min(400, workArea.width - 100); // Ensure it fits with padding
    
    return {
      width: drawerWidth,
      height: availableHeight
    };
  }

  /**
   * Calculates optimal window dimensions for given constraints
   * @param {number} preferredWidth - Preferred window width
   * @param {number} preferredHeight - Preferred window height
   * @param {number} [padding=100] - Padding to leave around window
   * @returns {Object} Object with width and height properties
   */
  static calculateOptimalWindowSize(preferredWidth, preferredHeight, padding = 100) {
    const workArea = this.getWorkArea();
    const screenBounds = this.getScreenBounds();
    
    if (!workArea || !screenBounds) {
      return { width: preferredWidth, height: preferredHeight };
    }
    
    const maxWidth = workArea.width - padding;
    const maxHeight = Math.min(workArea.height, screenBounds.height - padding);
    
    return {
      width: Math.min(preferredWidth, maxWidth),
      height: Math.min(preferredHeight, maxHeight)
    };
  }

  /**
   * Calculates position for drawer window (right edge of screen)
   * @param {number} drawerWidth - Width of the drawer window
   * @returns {Object} Object with x, y, startX properties for positioning
   */
  static calculateDrawerPosition(drawerWidth) {
    const screenBounds = this.getScreenBounds();
    const workArea = this.getWorkArea();
    
    if (!screenBounds || !workArea) {
      return { x: 0, y: 0, startX: 0 };
    }
    
    // Final position (visible) - ensure it doesn't go beyond screen
    const finalX = Math.max(0, screenBounds.x + screenBounds.width - drawerWidth);
    const finalY = workArea.y;
    
    // Start position (off-screen to the right)
    const startX = screenBounds.x + screenBounds.width;
    
    return {
      x: finalX,
      y: finalY,
      startX: startX
    };
  }

  /**
   * Calculates off-screen position for hiding drawer
   * @returns {number} X coordinate for off-screen position
   */
  static calculateOffScreenPosition() {
    const screenBounds = this.getScreenBounds();
    
    if (!screenBounds) {
      return 0;
    }
    
    return screenBounds.x + screenBounds.width;
  }

  /**
   * Logs comprehensive display information for debugging
   */
  static logDisplayInfo() {
    try {
      const displays = this.getAllDisplays();
      const primaryDisplay = this.getPrimaryDisplay();
      
      console.log('\n=== Display Information ===');
      displays.forEach((display, index) => {
        console.log(`Display ${index + 1}:`);
        console.log(`  Size: ${display.size.width}x${display.size.height}`);
        console.log(`  Scale Factor: ${display.scaleFactor}`);
        console.log(`  Refresh Rate: ${display.displayFrequency || 'Unknown'} Hz`);
        console.log(`  Primary: ${display.id === primaryDisplay?.id}`);
        console.log(`  Internal: ${display.internal || false}`);
        console.log(`  Bounds: x=${display.bounds.x}, y=${display.bounds.y}, w=${display.bounds.width}, h=${display.bounds.height}`);
        console.log(`  Work Area: x=${display.workArea.x}, y=${display.workArea.y}, w=${display.workArea.width}, h=${display.workArea.height}`);
        console.log('');
      });
      console.log('=========================\n');
    } catch (error) {
      console.error('Error getting display info:', error);
    }
  }

  /**
   * Gets frame interval for animations based on display refresh rate
   * @returns {number} Frame interval in milliseconds
   */
  static getFrameInterval() {
    const refreshRate = this.getDisplayRefreshRate();
    return 1000 / refreshRate;
  }

  /**
   * Checks if a display supports high refresh rates
   * @returns {boolean} True if display supports >60Hz
   */
  static supportsHighRefreshRate() {
    const refreshRate = this.getDisplayRefreshRate();
    return refreshRate > 60;
  }
}

module.exports = DisplayManager;