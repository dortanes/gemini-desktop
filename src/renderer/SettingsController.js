class SettingsController {
  constructor(electronAPI) {
    this.currentRecordingInput = null;
    this.recordedKeys = [];
    this.elements = {};
    this.electronAPI = electronAPI;
    
    this.keyMap = {
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right',
      'Enter': 'Return',
      'Escape': 'Escape',
      'Tab': 'Tab',
      'Backspace': 'BackSpace',
      'Delete': 'Delete',
      'Insert': 'Insert',
      'Home': 'Home',
      'End': 'End',
      'PageUp': 'Page_Up',
      'PageDown': 'Page_Down'
    };
  }

  initialize() {
    this.initializeElements();
    this.setupEventListeners();
    this.loadSettings();
  }

  initializeElements() {
    this.elements = {
      closeBtn: document.getElementById('close-btn'),
      saveBtn: document.getElementById('save-btn'),
      resetBtn: document.getElementById('reset-btn'),
      statusMessage: document.getElementById('status-message'),
      toggleMiniInput: document.getElementById('toggle-mini-hotkey'),
      showMainInput: document.getElementById('show-main-hotkey'),
      reloadGeminiInput: document.getElementById('reload-gemini-hotkey'),
      voiceModeInput: document.getElementById('voice-mode-hotkey')
    };
  }

  setupEventListeners() {
    this.elements.closeBtn.addEventListener('click', () => this.handleClose());
    this.elements.saveBtn.addEventListener('click', () => this.handleSave());
    this.elements.resetBtn.addEventListener('click', () => this.handleReset());

    this.setupHotkeyRecording(this.elements.toggleMiniInput, 'toggle-mini');
    this.setupHotkeyRecording(this.elements.showMainInput, 'show-main');
    this.setupHotkeyRecording(this.elements.reloadGeminiInput, 'reload-gemini');
    this.setupHotkeyRecording(this.elements.voiceModeInput, 'voice-mode');

    document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));
  }

  async handleClose() {
    await this.electronAPI.closeSettingsWindow();
  }

  async handleSave() {
    const settings = {
      toggleMiniHotkey: this.elements.toggleMiniInput.value,
      showMainHotkey: this.elements.showMainInput.value,
      reloadGeminiHotkey: this.elements.reloadGeminiInput.value,
      voiceModeHotkey: this.elements.voiceModeInput.value
    };

    try {
      const result = await this.electronAPI.saveHotkeySettings(settings);
      if (result) {
        this.showStatusMessage('Settings saved successfully!', 'success');
      } else {
        this.showStatusMessage('Error saving settings', 'error');
      }
    } catch (error) {
      this.showStatusMessage('Error saving settings', 'error');
      console.error('Error saving settings:', error);
    }
  }

  async handleReset() {
    try {
      const result = await this.electronAPI.resetHotkeySettings();
      if (result) {
        await this.loadSettings();
        this.showStatusMessage('Settings reset to default values', 'success');
      } else {
        this.showStatusMessage('Error resetting settings', 'error');
      }
    } catch (error) {
      this.showStatusMessage('Error resetting settings', 'error');
      console.error('Error resetting settings:', error);
    }
  }

  async loadSettings() {
    try {
      const settings = await this.electronAPI.getHotkeySettings();
      this.elements.toggleMiniInput.value = settings.toggleMiniHotkey || '';
      this.elements.showMainInput.value = settings.showMainHotkey || '';
      this.elements.reloadGeminiInput.value = settings.reloadGeminiHotkey || '';
      this.elements.voiceModeInput.value = settings.voiceModeHotkey || '';
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  setupHotkeyRecording(input, actionType) {
    input.addEventListener('click', () => this.startRecording(input, actionType));
    input.addEventListener('focus', () => this.startRecording(input, actionType));
  }

  startRecording(input, actionType) {
    if (this.currentRecordingInput && this.currentRecordingInput !== input) {
      this.stopRecording(this.currentRecordingInput);
    }

    this.currentRecordingInput = input;
    this.recordedKeys = [];

    input.classList.add('recording');
    input.value = 'Press keys...';
    input.blur();

    document.addEventListener('keydown', (e) => this.handleKeyRecording(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  stopRecording(input) {
    if (!input) return;

    input.classList.remove('recording');
    this.currentRecordingInput = null;

    document.removeEventListener('keydown', this.handleKeyRecording);
    document.removeEventListener('keyup', this.handleKeyUp);

    if (this.recordedKeys.length > 0) {
      const hotkeyString = this.formatHotkey(this.recordedKeys);
      input.value = hotkeyString;
    } else {
      input.value = '';
    }

    this.recordedKeys = [];
  }

  handleKeyRecording(event) {
    event.preventDefault();
    event.stopPropagation();

    const key = event.key;

    if (['Control', 'Alt', 'Shift', 'Meta', 'ControlLeft', 'ControlRight',
         'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight', 'MetaLeft', 'MetaRight'].includes(key)) {
      return;
    }

    const modifiers = [];
    if (event.ctrlKey) modifiers.push('Ctrl');
    if (event.altKey) modifiers.push('Alt');
    if (event.shiftKey) modifiers.push('Shift');
    if (event.metaKey) modifiers.push('Super');

    let mainKey = this.normalizeKey(key);
    this.recordedKeys = [...modifiers, mainKey];

    if (this.currentRecordingInput) {
      this.currentRecordingInput.value = this.formatHotkey(this.recordedKeys);
    }
  }

  normalizeKey(key) {
    if (key === ' ') {
      return 'space';
    } else if (key.length === 1) {
      return key.toUpperCase();
    } else if (key.startsWith('F') && key.length <= 3) {
      return key;
    } else {
      return this.keyMap[key] || key;
    }
  }

  handleKeyUp(event) {
    if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
      setTimeout(() => {
        if (this.currentRecordingInput) {
          this.stopRecording(this.currentRecordingInput);
        }
      }, 100);
    }
  }

  formatHotkey(keys) {
    if (keys.length === 0) return '';
    return keys.join('+');
  }

  showStatusMessage(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    if (type === 'error') icon = 'error';

    notification.innerHTML = `
      <span class="material-symbols-outlined">${icon}</span>
      ${message}
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 3000);
  }

  handleGlobalKeydown(e) {
    if (this.currentRecordingInput) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.elements.closeBtn.click();
    }

    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      this.elements.saveBtn.click();
    }
  }
}

export default SettingsController;