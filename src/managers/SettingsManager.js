const { BrowserWindow, ipcMain, globalShortcut, app } = require('electron');
const fs = require('fs');
const path = require('path');

class SettingsManager {
  constructor() {
    this.settingsFile = path.join(app.getPath('userData'), 'settings.json');
    this.settings = {
      toggleMiniHotkey: '',
      showMainHotkey: '',
      reloadGeminiHotkey: '',
      hasShownTrayNotification: false
    };
    this.settingsWindow = null;
    this.mainWindow = null;
    this.geminiView = null;
    this.createMiniWindowCallback = null;
    this.showMainWindowCallback = null;
    this.reloadGeminiCallback = null;
  }

  setMainWindow(window) {
    this.mainWindow = window;
  }

  setGeminiView(view) {
    this.geminiView = view;
  }

  setCallbacks(callbacks) {
    this.createMiniWindowCallback = callbacks.createMiniWindow;
    this.showMainWindowCallback = callbacks.showMainWindow;
    this.reloadGeminiCallback = callbacks.reloadGemini;
  }

  loadSettings() {
    try {
      if (fs.existsSync(this.settingsFile)) {
        const data = fs.readFileSync(this.settingsFile, 'utf8');
        this.settings = { ...this.settings, ...JSON.parse(data) };
        console.log('Settings loaded:', this.settings);
      } else {
        console.log('No settings file found, using defaults');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  saveSettings() {
    try {
      fs.writeFileSync(this.settingsFile, JSON.stringify(this.settings, null, 2));
      console.log('Settings saved:', this.settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  getSettings() {
    return this.settings;
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  registerGlobalShortcuts() {
    // Unregister all existing shortcuts first
    globalShortcut.unregisterAll();

    // Register toggle mini window shortcut
    if (this.settings.toggleMiniHotkey) {
      try {
        const ret = globalShortcut.register(this.settings.toggleMiniHotkey, () => {
          console.log('Toggle mini hotkey pressed');
          if (this.createMiniWindowCallback) {
            this.createMiniWindowCallback();
          }
        });
        if (!ret) {
          console.log('Registration failed for toggle mini hotkey');
        }
      } catch (error) {
        console.error('Error registering toggle mini hotkey:', error);
      }
    }

    // Register show main window shortcut
    if (this.settings.showMainHotkey) {
      try {
        const ret = globalShortcut.register(this.settings.showMainHotkey, async () => {
          console.log('Show main hotkey pressed');
          if (this.showMainWindowCallback) {
            try {
              await this.showMainWindowCallback();
            } catch (error) {
              console.error('Error showing main window from hotkey:', error);
            }
          }
        });
        if (!ret) {
          console.log('Registration failed for show main hotkey');
        }
      } catch (error) {
        console.error('Error registering show main hotkey:', error);
      }
    }

    // Register reload Gemini shortcut
    if (this.settings.reloadGeminiHotkey) {
      try {
        const ret = globalShortcut.register(this.settings.reloadGeminiHotkey, () => {
          console.log('Reload Gemini hotkey pressed');
          if (this.reloadGeminiCallback) {
            this.reloadGeminiCallback();
          }
        });
        if (!ret) {
          console.log('Registration failed for reload Gemini hotkey');
        }
      } catch (error) {
        console.error('Error registering reload Gemini hotkey:', error);
      }
    }
  }

  createSettingsWindow() {
    if (this.settingsWindow) {
      this.settingsWindow.focus();
      return;
    }

    this.settingsWindow = new BrowserWindow({
      width: 600,
      height: 500,
      parent: this.mainWindow,
      modal: true,
      show: false,
      frame: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../../preload.js')
      }
    });

    this.settingsWindow.loadFile('settings.html');

    this.settingsWindow.once('ready-to-show', () => {
      this.settingsWindow.show();
    });

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });
  }

  openSettingsWindow() {
    this.createSettingsWindow();
  }

  closeSettingsWindow() {
    if (this.settingsWindow) {
      this.settingsWindow.close();
    }
  }

  getHotkeySettings() {
    return this.settings;
  }

  saveHotkeySettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.registerGlobalShortcuts();
    return true;
  }

  resetHotkeySettings() {
    this.settings = {
      ...this.settings,
      toggleMiniHotkey: '',
      showMainHotkey: '',
      reloadGeminiHotkey: ''
    };
    this.saveSettings();
    this.registerGlobalShortcuts();
    return true;
  }

  markTrayNotificationShown() {
    this.settings.hasShownTrayNotification = true;
    this.saveSettings();
  }

  hasShownTrayNotification() {
    return this.settings.hasShownTrayNotification;
  }

  cleanup() {
    globalShortcut.unregisterAll();
    if (this.settingsWindow) {
      this.settingsWindow.close();
      this.settingsWindow = null;
    }
  }
}

module.exports = SettingsManager;