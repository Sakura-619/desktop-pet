const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const petState = require('./src/engine/pet-state');
const win32Mischief = require('./src/engine/win32-mischief');

let catWindow = null;
let stationWindow = null;
let walkTimer = null;
let isBusyWalkingToTarget = false;

function broadcastState() {
  const state = petState.getState();
  if (catWindow && !catWindow.isDestroyed()) {
    catWindow.webContents.send('pet-state-update', state);
  }
  if (stationWindow && !stationWindow.isDestroyed()) {
    stationWindow.webContents.send('pet-state-update', state);
  }
}

function createWindows() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;

  // 1. Station Window (Corner base for bed, food, HUD, and taskbar entry)
  const stationWidth = 330;
  const stationHeight = 245;
  const stationX = Math.round(workArea.x + workArea.width - stationWidth - 18);
  const stationY = Math.round(workArea.y + workArea.height - stationHeight - 16);

  stationWindow = new BrowserWindow({
    width: stationWidth,
    height: stationHeight,
    x: stationX,
    y: stationY,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: false, // SHOWS DIRECTLY IN TASKBAR LIKE A NORMAL GAME
    title: 'Screen Pet: Cat Companion',
    resizable: false,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  stationWindow.setAlwaysOnTop(true);
  stationWindow.loadFile(path.join(__dirname, 'src/station/station.html'));

  // 2. Roaming Cat Window (Moves freely across entire monitor)
  const catWidth = 150;
  const catHeight = 150;
  const startCatX = Math.round(workArea.x + workArea.width * 0.45);
  const startCatY = Math.round(workArea.y + workArea.height - catHeight - 45);

  catWindow = new BrowserWindow({
    width: catWidth,
    height: catHeight,
    x: startCatX,
    y: startCatY,
    transparent: true,
    backgroundColor: '#00000000',
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

  catWindow.setAlwaysOnTop(true);
  catWindow.loadFile(path.join(__dirname, 'src/overlay/cat-roam.html'));

  stationWindow.webContents.once('did-finish-load', () => broadcastState());
  catWindow.webContents.once('did-finish-load', () => broadcastState());

  startAutonomousRoaming();
}

// Autonomous Cat Roaming Across the Monitor
function startAutonomousRoaming() {
  if (walkTimer) clearInterval(walkTimer);

  walkTimer = setInterval(() => {
    if (!catWindow || catWindow.isDestroyed() || isBusyWalkingToTarget) return;

    const state = petState.getState();

    // Check if cat is sleeping in bed
    if (state.isSleeping) {
      return;
    }

    // Check if cat got exhausted on its own -> walks to bed!
    if (state.energy <= 10) {
      guideCatToBed();
      return;
    }

    const roll = Math.random();
    if (roll < 0.4) {
      // Wander across the screen
      const dir = Math.random() < 0.5 ? -1 : 1;
      walkCatInDirection(dir, 20 + Math.floor(Math.random() * 30));
    } else if (roll < 0.7) {
      // Stop and sit
      if (catWindow && !catWindow.isDestroyed()) {
        catWindow.webContents.send('cat-action', { type: 'idle' });
      }
    } else if (roll < 0.85) {
      // Playful meow
      if (catWindow && !catWindow.isDestroyed()) {
        catWindow.webContents.send('cat-action', { type: 'speech', text: 'Meow~ 🐾' });
      }
    } else {
      // Playful window mischief check
      if (state.mischiefEnabled && Math.random() < 0.4) {
        triggerMischiefAction();
      }
    }
  }, 6500);
}

// Smoothly walk cat in a direction
function walkCatInDirection(dir, steps) {
  if (!catWindow || catWindow.isDestroyed()) return;

  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;
  const minX = workArea.x + 10;
  const maxX = workArea.x + workArea.width - 160;

  catWindow.webContents.send('cat-action', { type: 'walk_dir', direction: dir });

  let currentStep = 0;
  const interval = setInterval(() => {
    if (!catWindow || catWindow.isDestroyed() || currentStep >= steps || isBusyWalkingToTarget) {
      clearInterval(interval);
      if (catWindow && !catWindow.isDestroyed()) {
        catWindow.webContents.send('cat-action', { type: 'idle' });
      }
      return;
    }

    const [currX, currY] = catWindow.getPosition();
    let nextX = currX + dir * 3;

    // Bounce off screen borders
    if (nextX <= minX) {
      nextX = minX;
      dir = 1;
      catWindow.webContents.send('cat-action', { type: 'walk_dir', direction: 1 });
    } else if (nextX >= maxX) {
      nextX = maxX;
      dir = -1;
      catWindow.webContents.send('cat-action', { type: 'walk_dir', direction: -1 });
    }

    catWindow.setPosition(Math.round(nextX), currY);
    currentStep++;
  }, 45);
}

// Guide Cat smoothly towards target coordinates (e.g. food bowl or bed)
function walkCatToTarget(targetX, targetY, onArrived) {
  if (!catWindow || catWindow.isDestroyed()) return;
  isBusyWalkingToTarget = true;

  const stepTimer = setInterval(() => {
    if (!catWindow || catWindow.isDestroyed()) {
      clearInterval(stepTimer);
      isBusyWalkingToTarget = false;
      return;
    }

    const [currX, currY] = catWindow.getPosition();
    const dx = targetX - currX;
    const dy = targetY - currY;
    const dist = Math.hypot(dx, dy);

    if (dist < 8) {
      clearInterval(stepTimer);
      catWindow.setPosition(targetX, targetY);
      isBusyWalkingToTarget = false;
      if (onArrived) onArrived();
      return;
    }

    const dirX = Math.sign(dx);
    catWindow.webContents.send('cat-action', { type: 'walk_dir', direction: dirX || 1 });

    const stepX = Math.sign(dx) * Math.min(Math.abs(dx), 4);
    const stepY = Math.sign(dy) * Math.min(Math.abs(dy), 3);

    catWindow.setPosition(Math.round(currX + stepX), Math.round(currY + stepY));
  }, 40);
}

// Guide Cat to Food Bowl at the Station
function guideCatToFood() {
  if (!stationWindow || stationWindow.isDestroyed()) return;
  const [stX, stY] = stationWindow.getPosition();
  const targetX = stX + 170; // Food bowl position
  const targetY = stY + 60;

  if (catWindow && !catWindow.isDestroyed()) {
    catWindow.webContents.send('cat-action', { type: 'speech', text: 'Food time! 🐟' });
  }

  walkCatToTarget(targetX, targetY, () => {
    if (catWindow && !catWindow.isDestroyed()) {
      catWindow.webContents.send('cat-action', { type: 'feed' });
    }
  });
}

// Guide Cat to Bed at the Station
function guideCatToBed() {
  if (!stationWindow || stationWindow.isDestroyed()) return;
  const [stX, stY] = stationWindow.getPosition();
  const targetX = stX + 25; // Bed position
  const targetY = stY + 60;

  if (catWindow && !catWindow.isDestroyed()) {
    catWindow.webContents.send('cat-action', { type: 'speech', text: 'Sleepy... 🛏️' });
  }

  walkCatToTarget(targetX, targetY, () => {
    petState.data.isSleeping = true;
    petState.save();
    broadcastState();
    if (catWindow && !catWindow.isDestroyed()) {
      catWindow.webContents.send('cat-action', { type: 'sleep' });
    }
  });
}

// Mischief Action
async function triggerMischiefAction() {
  if (!catWindow || catWindow.isDestroyed()) return;

  const isMinimize = Math.random() < 0.5;
  catWindow.webContents.send('cat-action', {
    type: 'speech',
    text: isMinimize ? 'Pounce! 😼' : 'Hehehe! 🐾'
  });

  await new Promise(r => setTimeout(r, 600));

  if (isMinimize) {
    await win32Mischief.minimizeActiveWindow();
  } else {
    const dir = Math.random() < 0.5 ? -1 : 1;
    await win32Mischief.dragActiveWindow(dir * 50, 0);
  }
}

// App Lifecycle
app.whenReady().then(() => {
  createWindows();

  // Periodic real-time decay & state broadcast
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
  petState.feed();
  broadcastState();
  guideCatToFood();
});

ipcMain.on('pet-cat', () => {
  petState.pet();
  broadcastState();
});

ipcMain.on('toggle-rest', () => {
  const state = petState.getState();
  if (state.isSleeping) {
    // Wake up
    petState.data.isSleeping = false;
    petState.save();
    broadcastState();
    if (catWindow && !catWindow.isDestroyed()) {
      catWindow.webContents.send('cat-action', { type: 'wake' });
    }
  } else {
    // Walk to bed and rest
    guideCatToBed();
  }
});

ipcMain.on('set-customization', (_event, data) => {
  petState.setCustomization(data);
  broadcastState();
});

ipcMain.on('trigger-mischief', () => {
  triggerMischiefAction();
});

// Manual dragging of cat
ipcMain.on('drag-cat', (_event, { deltaX, deltaY }) => {
  if (!catWindow || catWindow.isDestroyed()) return;
  const [currX, currY] = catWindow.getPosition();
  catWindow.setPosition(Math.round(currX + deltaX), Math.round(currY + deltaY));
});

// Window controls
ipcMain.on('minimize-window', () => {
  if (stationWindow && !stationWindow.isDestroyed()) {
    stationWindow.minimize();
  }
});

ipcMain.on('close-window', () => {
  app.quit();
});
