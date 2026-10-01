const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const petState = require('./src/engine/pet-state');
const win32Mischief = require('./src/engine/win32-mischief');

let catWindow = null;
let widgetWindow = null;
let walkInterval = null;

function broadcastState() {
  const state = petState.getState();
  if (catWindow && !catWindow.isDestroyed()) {
    catWindow.webContents.send('pet-state-update', state);
  }
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.webContents.send('pet-state-update', state);
  }
}

function createWindows() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;

  // 1. Create Cat Overlay Window (180x180 px)
  catWindow = new BrowserWindow({
    width: 180,
    height: 180,
    x: Math.round(workArea.x + workArea.width * 0.6),
    y: Math.round(workArea.y + workArea.height - 210),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  catWindow.setAlwaysOnTop(true, 'screen-saver');
  catWindow.loadFile(path.join(__dirname, 'src/overlay/cat-overlay.html'));

  // 2. Create Corner Widget Window (310x370 px)
  const widgetWidth = 310;
  const widgetHeight = 370;
  widgetWindow = new BrowserWindow({
    width: widgetWidth,
    height: widgetHeight,
    x: Math.round(workArea.x + workArea.width - widgetWidth - 16),
    y: Math.round(workArea.y + workArea.height - widgetHeight - 16),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  widgetWindow.setAlwaysOnTop(true, 'floating');
  widgetWindow.loadFile(path.join(__dirname, 'src/widget/widget.html'));

  // Check initial dismissed state
  const state = petState.getState();
  if (state.isDismissed) {
    catWindow.hide();
  }

  // Once both are ready, send state
  widgetWindow.webContents.once('did-finish-load', () => {
    broadcastState();
  });
  catWindow.webContents.once('did-finish-load', () => {
    broadcastState();
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindows();

  // Periodic real-time decay & state broadcast (every 10 seconds)
  setInterval(() => {
    petState.applyDecay();
    broadcastState();
  }, 10000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Event Handlers
ipcMain.on('feed-cat', () => {
  const result = petState.feed();
  broadcastState();
  if (catWindow && !catWindow.isDestroyed() && result.success) {
    catWindow.webContents.send('cat-action', { type: 'feed' });
  }
});

ipcMain.on('pet-cat', () => {
  const result = petState.pet();
  broadcastState();
  if (catWindow && !catWindow.isDestroyed() && result.success) {
    catWindow.webContents.send('cat-action', { type: 'pet' });
  }
});

ipcMain.on('toggle-dismiss', () => {
  const state = petState.getState();
  const willDismiss = !state.isDismissed;
  petState.setDismissed(willDismiss);
  broadcastState();

  if (catWindow && !catWindow.isDestroyed()) {
    if (willDismiss) {
      catWindow.webContents.send('cat-action', { type: 'sleep' });
      setTimeout(() => {
        if (catWindow && !catWindow.isDestroyed() && petState.getState().isDismissed) {
          catWindow.hide();
        }
      }, 1500);
    } else {
      catWindow.show();
      catWindow.webContents.send('cat-action', { type: 'wake' });
    }
  }
});

ipcMain.on('set-customization', (_event, data) => {
  petState.setCustomization(data);
  broadcastState();
});

ipcMain.on('toggle-mischief', (_event, enabled) => {
  petState.toggleMischief(enabled);
  broadcastState();
});

// Mischief Action Trigger
async function performMischief() {
  if (!catWindow || catWindow.isDestroyed()) return;

  const isMinimize = Math.random() < 0.5;
  catWindow.webContents.send('cat-action', {
    type: 'speech',
    text: isMinimize ? 'Watch this! 😼' : 'Hold on tight! 🐾'
  });

  await new Promise(r => setTimeout(r, 800));

  if (isMinimize) {
    await win32Mischief.minimizeActiveWindow();
  } else {
    const dir = Math.random() < 0.5 ? -1 : 1;
    await win32Mischief.dragActiveWindow(dir * 50, 0);
  }
}

ipcMain.on('trigger-mischief', () => {
  performMischief();
});

ipcMain.on('check-random-mischief', () => {
  const state = petState.getState();
  if (win32Mischief.canDoRandomMischief(state.mischiefEnabled)) {
    performMischief();
  }
});

// Corner Widget Size Adjust (Expanded vs Minimized Paw)
ipcMain.on('set-widget-size', (_event, { width, height }) => {
  if (!widgetWindow || widgetWindow.isDestroyed()) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;

  const newX = Math.round(workArea.x + workArea.width - width - 16);
  const newY = Math.round(workArea.y + workArea.height - height - 16);

  widgetWindow.setBounds({
    x: newX,
    y: newY,
    width: Math.round(width),
    height: Math.round(height)
  });
});

// Manual Cat Dragging
ipcMain.on('drag-cat-window', (_event, { deltaX, deltaY }) => {
  if (!catWindow || catWindow.isDestroyed()) return;
  const [currentX, currentY] = catWindow.getPosition();
  catWindow.setPosition(Math.round(currentX + deltaX), Math.round(currentY + deltaY));
});

// Autonomous Cat Walk
ipcMain.on('start-cat-walk', (_event, { direction }) => {
  if (!catWindow || catWindow.isDestroyed()) return;
  if (walkInterval) clearInterval(walkInterval);

  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;
  const minX = workArea.x;
  const maxX = workArea.x + workArea.width - 180;

  let steps = 0;
  const maxSteps = 40 + Math.floor(Math.random() * 30); // ~2 to 3.5 seconds

  walkInterval = setInterval(() => {
    if (!catWindow || catWindow.isDestroyed() || steps >= maxSteps) {
      clearInterval(walkInterval);
      walkInterval = null;
      if (catWindow && !catWindow.isDestroyed()) {
        catWindow.webContents.send('cat-action', { type: 'wake' }); // returns to idle
      }
      return;
    }

    const [currentX, currentY] = catWindow.getPosition();
    let nextX = currentX + direction * 3;

    // Bounce off screen walls
    if (nextX <= minX) {
      nextX = minX;
      direction = 1;
    } else if (nextX >= maxX) {
      nextX = maxX;
      direction = -1;
    }

    catWindow.setPosition(Math.round(nextX), currentY);
    steps++;
  }, 50);
});
