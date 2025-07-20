class WindowController {
  constructor() {
    this.toolbar = null;
    this.buttons = {};
    this.isInitialized = false;
    
    this.initializeElements();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.setupIPCListeners();
  }

  initializeElements() {
    this.toolbar = document.querySelector('.custom-toolbar');
    
    this.buttons = {
      minimize: document.getElementById('minimize-btn'),
      maximize: document.getElementById('maximize-btn'),
      restore: document.getElementById('restore-btn'),
      close: document.getElementById('close-btn'),
      back: document.getElementById('back-btn'),
      forward: document.getElementById('forward-btn'),
      reload: document.getElementById('reload-btn'),
      devtools: document.getElementById('devtools-btn'),
      settings: document.getElementById('settings-btn')
    };
  }

  setupEventListeners() {
    this.setupWindowControls();
    this.setupNavigationControls();
    this.setupUtilityControls();
  }

  setupWindowControls() {
    this.buttons.minimize?.addEventListener('click', () => this.minimizeWindow());
    this.buttons.maximize?.addEventListener('click', () => this.maximizeWindow());
    this.buttons.restore?.addEventListener('click', () => this.restoreWindow());
    this.buttons.close?.addEventListener('click', () => this.closeWindow());
  }

  setupNavigationControls() {
    this.buttons.back?.addEventListener('click', () => this.goBack());
    this.buttons.forward?.addEventListener('click', () => this.goForward());
    this.buttons.reload?.addEventListener('click', () => this.reloadGemini());
  }

  setupUtilityControls() {
    this.buttons.devtools?.addEventListener('click', () => this.openDevtools());
    this.buttons.settings?.addEventListener('click', () => this.openSettings());
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcut(e));
  }

  setupIPCListeners() {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on('window-maximized', (event, isMaximized) => {
        this.updateMaximizeButton(isMaximized);
      });

      window.electron.ipcRenderer.on('fullscreen-changed', (event, isFullScreen) => {
        this.updateToolbarVisibility(isFullScreen);
      });
    }
  }

  async minimizeWindow() {
    await window.electronAPI.minimizeWindow();
  }

  async maximizeWindow() {
    await window.electronAPI.maximizeWindow();
    setTimeout(() => this.updateMaximizeButton(), 100);
  }

  async restoreWindow() {
    await window.electronAPI.maximizeWindow();
    setTimeout(() => this.updateMaximizeButton(), 100);
  }

  async closeWindow() {
    await window.electronAPI.closeWindow();
  }

  async goBack() {
    await window.electronAPI.goBack();
  }

  async goForward() {
    await window.electronAPI.goForward();
  }

  async reloadGemini() {
    await window.electronAPI.reloadGemini();
  }

  async openDevtools() {
    await window.electronAPI.openDevtools();
  }

  async openSettings() {
    await window.electronAPI.openSettings();
  }

  async toggleFullscreen() {
    await window.electronAPI.toggleFullscreen();
  }

  async updateMaximizeButton(isMaximized = null) {
    try {
      if (isMaximized === null) {
        isMaximized = await window.electronAPI.isMaximized();
      }
      
      if (this.buttons.restore && this.buttons.maximize) {
        this.buttons.restore.style.display = isMaximized ? 'block' : 'none';
        this.buttons.maximize.style.display = isMaximized ? 'none' : 'block';
      }
    } catch (error) {
      console.error('Error updating maximize button:', error);
    }
  }

  updateToolbarVisibility(isFullScreen) {
    if (this.toolbar) {
      this.toolbar.style.display = isFullScreen ? 'none' : 'flex';
    }
  }

  handleKeyboardShortcut(e) {
    const shortcuts = {
      'F5': () => this.reloadGemini(),
      'F11': () => this.toggleFullscreen(),
      'Escape': () => this.handleEscapeKey()
    };

    const ctrlShortcuts = {
      'r': () => this.reloadGemini()
    };

    const altShortcuts = {
      'ArrowLeft': () => this.goBack(),
      'ArrowRight': () => this.goForward()
    };

    if (shortcuts[e.key]) {
      e.preventDefault();
      shortcuts[e.key]();
    } else if (e.ctrlKey && ctrlShortcuts[e.key]) {
      e.preventDefault();
      ctrlShortcuts[e.key]();
    } else if (e.altKey && altShortcuts[e.key]) {
      e.preventDefault();
      altShortcuts[e.key]();
    }
  }

  async handleEscapeKey() {
    const isFullScreen = await window.electronAPI.isFullscreen();
    if (isFullScreen) {
      this.toggleFullscreen();
    }
  }

  async initialize() {
    if (this.isInitialized) return;
    
    await this.updateMaximizeButton();
    this.isInitialized = true;
    console.log('WindowController initialized successfully');
  }
}

export default WindowController;