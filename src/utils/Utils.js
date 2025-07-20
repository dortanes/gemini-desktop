class WindowUtils {
  static isWindowValid(window) {
    return window && !window.isDestroyed();
  }

  static safeGetBounds(window) {
    try {
      if (!this.isWindowValid(window)) return null;
      return window.getBounds();
    } catch (error) {
      console.error('Error getting window bounds:', error);
      return null;
    }
  }

  static safeSetPosition(window, x, y) {
    try {
      if (!this.isWindowValid(window)) return false;
      if (typeof x !== 'number' || typeof y !== 'number') return false;
      
      window.setPosition(Math.round(x), Math.round(y));
      return true;
    } catch (error) {
      console.error('Error setting window position:', error);
      return false;
    }
  }
}

class FunctionUtils {
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

class MathUtils {
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  static lerp(start, end, progress) {
    return start + (end - start) * this.clamp(progress, 0, 1);
  }
}

class EasingUtils {
  static easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  static easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  static easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  static easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
}

module.exports = {
  WindowUtils,
  FunctionUtils,
  MathUtils,
  EasingUtils
};