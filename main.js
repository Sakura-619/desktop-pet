const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const petState = require('./src/engine/pet-state');
const win32Mischief = require('./src/engine/win32-mischief');

let mainWindow = null;

function broadcastState() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const state = petState.getState();
    mainWindow.webContents.send('pet-state-update', state);
  }
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;

  const winWidth = 680;
  const winHeight = 265;
  const posX = Math.round(workArea.x + workArea.width - winWidth - 20);
  const posY = Math.round(workArea.y + workArea.height - winHeight - 15);

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: posX,
    y: posY,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: false, // SHOWS DIRECTLY IN TASKBAR LIKE A NORMAL GAME
    title: 'Screen Pet: Cat Adventure',
    resizable: false,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(true);
  mainWindow.loadFile(path.join(__dirname, 'src/habitat/index.html'));

  mainWindow.webContents.once('did-finish-load', () => {
    broadcastState();
  });
}

// App Lifecycle
app.whenReady().then(() => {
  createWindow();

  // Periodic real-time decay & state broadcast (every 10 seconds)
  setInterval(() => {
    petState.applyDecay();
    broadcastState();
  }, 10000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Care Actions
ipcMain.on('feed-cat', () => {
  const result = petState.feed();
  broadcastState();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('cat-action', { type: 'feed', result });
  }
});

ipcMain.on('pet-cat', () => {
  const result = petState.pet();
  broadcastState();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('cat-action', { type: 'pet', result });
  }
});

ipcMain.on('set-customization', (_event, data) => {
  petState.setCustomization(data);
  broadcastState();
});

// Window Mischief Action
ipcMain.on('trigger-mischief', async () => {
  const isMinimize = Math.random() < 0.5;
  await new Promise(r => setTimeout(r, 600));

  if (isMinimize) {
    await win32Mischief.minimizeActiveWindow();
  } else {
    const dir = Math.random() < 0.5 ? -1 : 1;
    await win32Mischief.dragActiveWindow(dir * 50, 0);
  }
});

// Window Control Actions
ipcMain.on('minimize-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
});

ipcMain.on('toggle-pin', (_event, pinned) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(Boolean(pinned));
  }
});
