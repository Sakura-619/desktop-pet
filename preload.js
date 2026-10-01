const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Listeners
  onCatState: (callback) => {
    ipcRenderer.on('pet-state-update', (_event, state) => callback(state));
  },
  onCatAction: (callback) => {
    ipcRenderer.on('cat-action', (_event, action) => callback(action));
  },

  // Pet Care & Upgrades
  feedCat: () => ipcRenderer.send('feed-cat'),
  petCat: () => ipcRenderer.send('pet-cat'),
  toggleRest: () => ipcRenderer.send('toggle-rest'),
  setCustomization: (data) => ipcRenderer.send('set-customization', data),
  triggerMischief: () => ipcRenderer.send('trigger-mischief'),

  // Cat Movement & Dragging
  dragCat: (deltaX, deltaY) => ipcRenderer.send('drag-cat', { deltaX, deltaY }),

  // Window Controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window')
});
