import WindowController from './src/renderer/WindowController.js';
import ElectronAPI from './src/renderer/ElectronAPI.js';

window.addEventListener('DOMContentLoaded', async () => {
  console.log('Gemini App loaded successfully');
  
  window.electronAPI = new ElectronAPI();
  const windowController = new WindowController();
  
  await windowController.initialize();
});