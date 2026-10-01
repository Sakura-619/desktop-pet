const { execFile } = require('child_process');
const path = require('path');

class Win32Mischief {
  constructor() {
    this.scriptPath = path.join(__dirname, 'mischief.ps1');
    this.lastMischiefTime = 0;
    this.minIntervalMs = 45000; // at least 45 seconds between random mischief events
  }

  runCommand(action, deltaX = 0, deltaY = 0) {
    return new Promise((resolve) => {
      const args = [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', this.scriptPath,
        '-Action', action,
        '-DeltaX', String(deltaX),
        '-DeltaY', String(deltaY)
      ];

      execFile('powershell.exe', args, (error, stdout, stderr) => {
        if (error) {
          return resolve({ success: false, error: error.message });
        }
        try {
          const res = JSON.parse(stdout.trim());
          resolve({ success: true, result: res });
        } catch (e) {
          resolve({ success: true, raw: stdout.trim() });
        }
      });
    });
  }

  async minimizeActiveWindow() {
    this.lastMischiefTime = Date.now();
    return await this.runCommand('minimize');
  }

  async dragActiveWindow(deltaX = 40, deltaY = 0) {
    this.lastMischiefTime = Date.now();
    // Do a few smooth mini-nudges to make it look like a drag
    for (let step = 0; step < 4; step++) {
      await this.runCommand('drag', Math.round(deltaX / 4), Math.round(deltaY / 4));
      await new Promise(r => setTimeout(r, 60));
    }
    return { success: true };
  }

  canDoRandomMischief(enabled) {
    if (!enabled) return false;
    return (Date.now() - this.lastMischiefTime) > this.minIntervalMs;
  }
}

module.exports = new Win32Mischief();
