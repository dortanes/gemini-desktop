const {
  BrowserWindow,
  ipcMain,
  globalShortcut,
  app
} = require('electron');
const fs = require('fs');
const path = require('path');

class SettingsManager {
  constructor(animationHandler) {
    this.settingsFile = path.join(app.getPath('userData'), 'settings.json');
    this.settings = {
      toggleMiniHotkey: '',
      showMainHotkey: '',
      reloadGeminiHotkey: '',
      voiceModeHotkey: 'Ctrl+Shift+V',
      hasShownTrayNotification: false
    };
    this.settingsWindow = null;
    this.mainWindow = null;
    this.miniWindow = null;
    this.webContentsViewHandler = null;
    this.createMiniWindowCallback = null;
    this.showMainWindowCallback = null;
    this.reloadGeminiCallback = null;
    this.voiceModeActive = false;
    this.voiceModeTimeout = null;
    this.animationHandler = animationHandler;
    this.lastPromptContent = '';

    this.loadSettings();
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

  setWebContentsViewHandler(webContentsViewHandler) {
    this.webContentsViewHandler = webContentsViewHandler;
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
        this.settings = {
          ...this.settings,
          ...JSON.parse(data)
        };
        console.log('Settings loaded:', this.settings);
      } else {
        console.log('No settings file found, using defaults');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async toggleVoiceMode() {
    if (!this.webContentsViewHandler) {
      console.warn('Cannot toggle voice mode: WebContentsViewHandler not available');
      return;
    }

    const geminiView = this.webContentsViewHandler.getGeminiView();
    if (!geminiView || !geminiView.webContents) {
      console.warn('Cannot toggle voice mode: Gemini view not available');
      return;
    }

    try {
      if (!this.voiceModeActive) {
        // Start voice mode
        console.log('Starting voice mode');
        this.voiceModeActive = true;

        // Create a new chat
        await this.createNewChat();

        // Show drawer panel
        if (!this.mainWindow.isVisible() && !this.animationHandler.getIsMiniWindowVisible()) this.animationHandler.showDrawerPanel();

        // Wait for page to be ready and click the voice button
        const voiceModeSuccess = await geminiView.webContents.executeJavaScript(`
          (function() {
            if (document.querySelector('.blue-circle')) return false;
            const voiceButton = document.querySelector('[data-node-type="speech_dictation_mic_button"]');
            if (voiceButton) voiceButton.click();
            return true;
          })();
        `);
        if (!voiceModeSuccess) return;

        // Start monitoring for changes
        this.startVoiceMonitoring();
      } else {
        // Stop voice mode
        console.log('Stopping voice mode');
        this.stopVoiceMode();
      }
    } catch (error) {
      console.error('Error toggling voice mode:', error);
      this.voiceModeActive = false;
    }
  }

  async createNewChat() {
    if (!this.webContentsViewHandler) {
      return;
    }

    const geminiView = this.webContentsViewHandler.getGeminiView();
    if (!geminiView || !geminiView.webContents) {
      return;
    }

    try {
      // Get initial content with better element detection
      await geminiView.webContents.executeJavaScript(`
        (async () => {
          // Do not create a new chat if chat is empty
          const modelResponsesLength = document.querySelectorAll('model-response').length;
          if (modelResponsesLength === 0) return; 

          // Click on sidenav menu button to open
          document.querySelector('[data-test-id="side-nav-menu-button"]').click();

          // Wait 100ms
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Click on new chat button
          document.querySelector('button[aria-label="New chat"]').click();

          // Wait 100ms
          await new Promise(resolve => setTimeout(resolve, 100));

          // Click on backdrop to close
          document.querySelector('.mat-drawer-backdrop').click();
        })();
      `);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  }

  async startVoiceMonitoring() {
    if (!this.webContentsViewHandler) {
      return;
    }

    const geminiView = this.webContentsViewHandler.getGeminiView();
    if (!geminiView || !geminiView.webContents) {
      return;
    }

    try {
      // Get initial content with better element detection
      const initialContent = await geminiView.webContents.executeJavaScript(`
        (function() {
          // Try multiple selectors for the prompt input
          const selectors = [
            '[aria-label="Enter a prompt here"]',
            '[aria-label*="prompt"]',
            '[aria-label*="message"]',
            '[contenteditable="true"]',
            'div[role="textbox"]',
            '.ql-editor',
            '[data-placeholder*="prompt"]'
          ];
          
          for (const selector of selectors) {
            const promptElement = document.querySelector(selector);
            if (promptElement) {
              console.log('Found prompt element with selector:', selector);
              return promptElement.innerHTML || promptElement.textContent || '';
            }
          }
          
          console.warn('Prompt element not found with any selector');
          return '';
        })();
      `);

      this.lastPromptContent = initialContent;
      console.log('Voice monitoring started, initial content length:', initialContent.length);


      // Set initial 5-second timeout for voice mode
      console.log('Setting initial 5-second timeout for voice mode');
      this.voiceModeTimeout = setTimeout(() => {
        console.log('Initial 5-second timeout reached, stopping voice mode');
        this.stopVoiceMode();
      }, 5000);

      // Start monitoring for changes
      this.monitorPromptChanges();
    } catch (error) {
      console.error('Error starting voice monitoring:', error);
    }
  }

  async monitorPromptChanges() {
    if (!this.voiceModeActive || !this.webContentsViewHandler) {
      return;
    }

    const geminiView = this.webContentsViewHandler.getGeminiView();
    if (!geminiView || !geminiView.webContents) {
      return;
    }

    try {
      const currentContent = await geminiView.webContents.executeJavaScript(`
        (function() {
          // Try multiple selectors for the prompt input
          const selectors = [
            '[aria-label="Enter a prompt here"]',
            '[aria-label*="prompt"]',
            '[aria-label*="message"]',
            '[contenteditable="true"]',
            'div[role="textbox"]',
            '.ql-editor',
            '[data-placeholder*="prompt"]'
          ];
          
          for (const selector of selectors) {
            const promptElement = document.querySelector(selector);
            if (promptElement) {
              return promptElement.innerHTML || promptElement.textContent || '';
            }
          }
          
          return '';
        })();
      `);

      if (currentContent !== this.lastPromptContent) {
        // Content changed, reset timeout
        console.log('Content changed, resetting timeout. New length:', currentContent.length);
        this.lastPromptContent = currentContent;
        if (this.voiceModeTimeout) {
          clearTimeout(this.voiceModeTimeout);
        }

        // Set new timeout for 2 seconds of no changes
        this.voiceModeTimeout = setTimeout(() => {
          this.handleVoiceTimeout();
        }, 2000);
      }

      // Continue monitoring if voice mode is still active
      if (this.voiceModeActive) {
        setTimeout(() => this.monitorPromptChanges(), 100); // Check every 100ms
      }
    } catch (error) {
      console.error('Error monitoring prompt changes:', error);
      // Continue monitoring even if there's an error, but with a longer delay
      if (this.voiceModeActive) {
        setTimeout(() => this.monitorPromptChanges(), 1000);
      }
    }
  }

  async handleVoiceTimeout() {
    if (!this.voiceModeActive || !this.webContentsViewHandler) {
      return;
    }

    const geminiView = this.webContentsViewHandler.getGeminiView();
    if (!geminiView || !geminiView.webContents) {
      return;
    }

    try {
      console.log('Voice timeout reached, stopping recording and sending message');

      // Stop voice recording and send the message
      await geminiView.webContents.executeJavaScript(`
        (function() {
          // Try to find and click the voice button to stop recording
          const voiceSelectors = [
            '[aria-label="Stop voice input"]',
            '[aria-label*="Stop"]',
            '[aria-label*="voice"]',
            'button[data-testid*="voice"]',
            'button[aria-pressed="true"]'
          ];
          
          for (const selector of voiceSelectors) {
            const voiceButton = document.querySelector(selector);
            if (voiceButton) {
              console.log('Found voice stop button with selector:', selector);
              voiceButton.click();
              break;
            }
          }
          
          // Try to find and click the send button
          setTimeout(() => {
            const sendSelectors = [
              '[aria-label="Send message"]',
              '[aria-label*="Send"]',
              'button[data-testid*="send"]',
              'button[type="submit"]',
              '[role="button"][aria-label*="send"]'
            ];
            
            for (const selector of sendSelectors) {
              const sendButton = document.querySelector(selector);
              if (sendButton && !sendButton.disabled) {
                console.log('Found send button with selector:', selector);
                sendButton.click();
                break;
              }
            }
          }, 500);
        })();
      `);

      // Wait for the new response to be generated and then activate text-to-speech
      setTimeout(() => {
        this.waitForNewResponseAndActivateTTS();
      }, 1000); // Small delay to ensure message is sent

      // Stop voice mode
      this.stopVoiceMode();
    } catch (error) {
      console.error('Error handling voice timeout:', error);
      // Still try to stop voice mode even if there's an error
      this.stopVoiceMode();
    }
  }

  async waitForNewResponseAndActivateTTS() {
    if (!this.webContentsViewHandler) {
      return;
    }

    const geminiView = this.webContentsViewHandler.getGeminiView();
    if (!geminiView || !geminiView.webContents) {
      return;
    }

    try {
      console.log('Waiting for new response to be generated...');

      await geminiView.webContents.executeJavaScript(`
        (async () => {
          // Get pending request
          const pendingRequest = document.querySelector('pending-request');

          // Wait pending request to disappear
          await new Promise((resolve, reject) => {
            const observer = new MutationObserver((mutations) => {
              if (!document.querySelector('pending-request')) {
                observer.disconnect();
                resolve();
              }
            });
            observer.observe(document.body, { childList: true, subtree: true });
          });

          // Get last model response
          const modelResponses = document.querySelectorAll('model-response');
          const modelResponse = modelResponses[modelResponses.length - 1];
          if (!modelResponse) throw 'Model response doesnt exist!';

          // Get model response footer
          const footer = modelResponse.querySelector('.response-footer');
          if (!footer) throw 'Footer doesnt exist!';

          // Wait for model response footer to have "complete" class
          await new Promise((resolve, reject) => {
            const observer = new MutationObserver((mutations) => {
              if (footer.classList.contains('complete')) {
                observer.disconnect();
                resolve();
              }
            });
            observer.observe(footer, { attributes: true });
          });

          // Wait 500 ms
          await new Promise(resolve => setTimeout(resolve, 500));

          // Find the menu button within the response
          const menuButton = modelResponse.querySelector('button[data-test-id="more-menu-button"]');
          if (!menuButton) throw 'Menu button not found!';

          // Click on menu button to open
          menuButton.click();

          // Wait 500ms
          await new Promise(resolve => setTimeout(resolve, 500));

          // Find TTS button
          const textToSpeechButton = document.querySelector('.cdk-overlay-pane [aria-label="Text to speech"]');
          
          if (textToSpeechButton) {
            // Dispatch event
            const event = new Event('click', { bubbles: true });
            textToSpeechButton.dispatchEvent(event);
          } else {
            console.log('Text to speech button not found in menu');
          }

          // Click on overlay backdrop to close menu
          document.querySelector('.cdk-overlay-backdrop').click();
        })();
      `);

      console.info('TTS success');
    } catch (error) {
      console.error('Error waiting for new response:', error);
    }
  }

  async stopVoiceMode() {
    if (!this.webContentsViewHandler) {
      return;
    }

    const geminiView = this.webContentsViewHandler.getGeminiView();
    if (!geminiView || !geminiView.webContents) {
      return;
    }

    await geminiView.webContents.executeJavaScript(`
      (function() {
        if (!document.querySelector('.blue-circle')) return;
        const voiceButton = document.querySelector('[data-node-type="speech_dictation_mic_button"]');
        if (voiceButton) voiceButton.click();
      })();
    `);

    console.log('Voice mode stopped');
    this.voiceModeActive = false;
    if (this.voiceModeTimeout) {
      clearTimeout(this.voiceModeTimeout);
      this.voiceModeTimeout = null;
    }
    this.lastPromptContent = '';
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
    this.settings = {
      ...this.settings,
      ...newSettings
    };
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

    // Register voice mode shortcut
    if (this.settings.voiceModeHotkey) {
      try {
        const ret = globalShortcut.register(this.settings.voiceModeHotkey, () => {
          console.log('Voice mode hotkey pressed');
          this.toggleVoiceMode();
        });
        if (!ret) {
          console.log('Registration failed for voice mode hotkey');
        }
      } catch (error) {
        console.error('Error registering voice mode hotkey:', error);
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
    this.settings = {
      ...this.settings,
      ...newSettings
    };
    this.saveSettings();
    this.registerGlobalShortcuts();
    return true;
  }

  resetHotkeySettings() {
    this.settings = {
      ...this.settings,
      toggleMiniHotkey: '',
      showMainHotkey: '',
      reloadGeminiHotkey: '',
      voiceModeHotkey: ''
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
    this.stopVoiceMode(); // Stop voice mode if active
    globalShortcut.unregisterAll();
    if (this.settingsWindow) {
      this.settingsWindow.close();
      this.settingsWindow = null;
    }
  }
}

module.exports = SettingsManager;