class SettingsButtonHandler {
  constructor() {
    this.geminiView = null;
    this.settingsManager = null;
  }

  setGeminiView(geminiView) {
    this.geminiView = geminiView;
  }

  setSettingsManager(settingsManager) {
    this.settingsManager = settingsManager;
  }

  // Function to inject settings button into Gemini's top-bar-actions
  injectSettingsButton() {
    if (!this.geminiView || !this.geminiView.webContents) return;
    
    const injectionScript = `
      (function() {
        // Check if button already exists to avoid duplicates
        if (document.getElementById('gemini-settings-btn')) {
          return;
        }
        
        // Wait for top-bar-actions to be available
        function waitForTopBarActions() {
          const topBarActions = document.querySelector('[data-test-id="top-bar-actions"], .top-bar-actions');
          if (topBarActions) {
            // Create settings button using DOM methods instead of innerHTML
            const settingsBtn = document.createElement('button');
            settingsBtn.id = 'gemini-settings-btn';
            
            // Check if we're in a narrow viewport (drawer mode)
            const isNarrowViewport = window.innerWidth < 600;
            
            // Create the button container
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = \`
              display: flex;
              align-items: center;
              gap: 8px;
              padding: \${isNarrowViewport ? '8px' : '8px 12px'};
              border-radius: 8px;
              background: transparent;
              border: 1px solid #5f6368;
              color: #e8eaed;
              font-family: 'Google Sans', Roboto, sans-serif;
              font-size: 14px;
              cursor: pointer;
              transition: all 0.2s ease;
            \`;
            
            // Create the SVG icon
            const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgIcon.setAttribute('width', '18');
            svgIcon.setAttribute('height', '18');
            svgIcon.setAttribute('viewBox', '0 0 24 24');
            svgIcon.setAttribute('fill', 'currentColor');
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z');
            
            svgIcon.appendChild(path);
            
            // Assemble the button - only add text if not in narrow viewport
            buttonContainer.appendChild(svgIcon);
            
            if (!isNarrowViewport) {
              // Create the text span only for wider viewports
              const textSpan = document.createElement('span');
              textSpan.textContent = 'Open app settings';
              buttonContainer.appendChild(textSpan);
            }
            
            settingsBtn.appendChild(buttonContainer);
            
            // Add tooltip
            settingsBtn.title = 'Open app settings';
            
            // Add responsive behavior on window resize
            function updateButtonLayout() {
              const currentlyNarrow = window.innerWidth < 600;
              const textSpan = buttonContainer.querySelector('span');
              
              if (currentlyNarrow && textSpan) {
                // Remove text in narrow viewport
                textSpan.remove();
                buttonContainer.style.padding = '8px';
                settingsBtn.style.margin = '0 2px';
              } else if (!currentlyNarrow && !textSpan) {
                // Add text back in wide viewport
                const newTextSpan = document.createElement('span');
                newTextSpan.textContent = 'Open app settings';
                buttonContainer.appendChild(newTextSpan);
                buttonContainer.style.padding = '8px 12px';
                settingsBtn.style.margin = '0 4px';
              }
            }
            
            // Listen for window resize
            window.addEventListener('resize', updateButtonLayout);
            
            // Style the button with responsive margin
            settingsBtn.style.cssText = \`
              background: transparent;
              border: none;
              cursor: pointer;
              margin: \${isNarrowViewport ? '0 2px' : '0 4px'};
              border-radius: 8px;
              transition: all 0.2s ease;
            \`;
            
            // Add hover effect
            settingsBtn.addEventListener('mouseenter', function() {
              buttonContainer.style.background = 'rgba(95, 99, 104, 0.1)';
            });
            
            settingsBtn.addEventListener('mouseleave', function() {
              buttonContainer.style.background = 'transparent';
            });
            
            // Add click handler
            settingsBtn.addEventListener('click', function() {
              // Create a custom event that we can detect
              console.log('[GEMINI_SETTINGS_CLICK]');
            });
            
            // Insert the button at the end of top-bar-actions for better positioning
            topBarActions.appendChild(settingsBtn);
            
            console.log('Gemini AI Settings button injected successfully');
          } else {
            // Retry after a short delay if top-bar-actions not found
            setTimeout(waitForTopBarActions, 500);
          }
        }
        
        // Start waiting for top-bar-actions
        waitForTopBarActions();
      })();
    `;
    
    try {
      this.geminiView.webContents.executeJavaScript(injectionScript).catch((error) => {
        console.error('Error injecting settings button:', error);
      });
      
    } catch (error) {
      console.error('Error executing injection script:', error);
    }
  }

  // Set up console message listener for the settings button
  setupSettingsButtonListener() {
    if (!this.geminiView || !this.geminiView.webContents) return;
    
    this.geminiView.webContents.on('console-message', (event, level, message) => {
      if (message.includes('[GEMINI_SETTINGS_CLICK]')) {
        console.log('Settings button clicked in Gemini page');
        if (this.settingsManager) {
          this.settingsManager.createSettingsWindow();
        }
      }
    });
  }

  // Initialize the handler with event listeners
  initialize() {
    if (!this.geminiView || !this.geminiView.webContents) return;

    // Set up console message listener for settings button
    this.setupSettingsButtonListener();

    // Inject settings button when page is ready
    this.geminiView.webContents.on('did-finish-load', () => {
      console.log('Gemini page loaded');
      this.injectSettingsButton();
    });

    // Also inject on navigation (in case user navigates within Gemini)
    this.geminiView.webContents.on('did-navigate', () => {
      console.log('Gemini page navigated');
      setTimeout(() => {
        this.injectSettingsButton();
      }, 1000); // Wait for page to fully load
    });
  }
}

module.exports = SettingsButtonHandler;