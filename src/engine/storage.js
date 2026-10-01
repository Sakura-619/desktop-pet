const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class PetStorage {
  constructor() {
    // Save in user data directory or project root
    const dataDir = app ? app.getPath('userData') : __dirname;
    this.filePath = path.join(dataDir, 'pet-data.json');
    this.defaultData = {
      name: 'Mochi',
      fur: 'orange',        // 'orange' | 'tuxedo' | 'calico' | 'white'
      accessory: 'bell',    // 'bell' | 'bow' | 'hat' | 'none'
      hunger: 80,
      love: 70,
      friendshipLevel: 1,
      friendshipXP: 20,
      mealsToday: 1,
      lastFedTimestamp: Date.now(),
      lastDayDate: new Date().toDateString(),
      lastPettedTimestamp: Date.now(),
      lastDecayTimestamp: Date.now(),
      mischiefEnabled: true,
      isDismissed: false
    };
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        return { ...this.defaultData, ...parsed };
      }
    } catch (err) {
      console.warn('Failed to load pet data, using defaults:', err.message);
    }
    return { ...this.defaultData };
  }

  save(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save pet data:', err.message);
    }
  }
}

module.exports = new PetStorage();
