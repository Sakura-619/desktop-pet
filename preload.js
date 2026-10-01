const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Listeners
  onCatState: (callback) => {
    ipcRenderer.on('pet-state-update', (_event, state) => callback(state));
  },
  onCatAction: (callback) => {
    ipcRenderer.on('cat-action', (_event, action) => callback(action));
  },

  // Emitters
  feedCat: () => ipcRenderer.send('feed-cat'),
  petCat: () => ipcRenderer.send('pet-cat'),
  toggleDismiss: () => ipcRenderer.send('toggle-dismiss'),
  setCustomization: (data) => ipcRenderer.send('set-customization', data),
  toggleMischief: (enabled) => ipcRenderer.send('toggle-mischief', enabled),
  triggerMischief: () => ipcRenderer.send('trigger-mischief'),
  setWidgetSize: (width, height) => ipcRenderer.send('set-widget-size', { width, height }),
  dragCatWindow: (deltaX, deltaY) => ipcRenderer.send('drag-cat-window', { deltaX, deltaY }),
  startCatWalk: (direction) => ipcRenderer.send('start-cat-walk', { direction }),
  checkRandomMischief: () => ipcRenderer.send('check-random-mischief')
});
