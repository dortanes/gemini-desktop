import SettingsController from './src/renderer/SettingsController.js';
import SettingsElectronAPI from './src/renderer/SettingsElectronAPI.js';

window.addEventListener('DOMContentLoaded', () => {
  console.log('Settings window loaded');
  
  const settingsController = new SettingsController(
    new SettingsElectronAPI()
  );
  settingsController.initialize();
});
