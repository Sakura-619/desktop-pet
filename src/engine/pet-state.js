const petStorage = require('./storage');

const FRIENDSHIP_TITLES = [
  'Curious Stray',        // Level 1
  'New Friend',           // Level 2
  'Playful Companion',    // Level 3
  'Cuddle Buddy',         // Level 4
  'Trusted Partner',      // Level 5
  'Best Pals',            // Level 6
  'Inseparable',          // Level 7
  'Heartwarming Bond',    // Level 8
  'Royal Fluff',          // Level 9
  'Soulmate Kitty'        // Level 10
];

const XP_PER_LEVEL = 100;

class PetState {
  constructor() {
    this.data = petStorage.load();
    this.applyDecay();
  }

  // Calculate real-time hunger and love decay based on elapsed time
  applyDecay() {
    const now = Date.now();
    const todayStr = new Date().toDateString();

    // Check if new day for meals count
    if (this.data.lastDayDate !== todayStr) {
      this.data.lastDayDate = todayStr;
      this.data.mealsToday = 0;
    }

    const elapsedSeconds = Math.max(0, (now - (this.data.lastDecayTimestamp || now)) / 1000);
    this.data.lastDecayTimestamp = now;

    // Decay rate: ~10% hunger per hour (100% / 10 hrs = ~0.0028% per second)
    const hungerDecay = elapsedSeconds * (100 / (10 * 3600));
    this.data.hunger = Math.max(0, Math.min(100, this.data.hunger - hungerDecay));

    // Love decay: ~5% love per hour if neglected
    const loveDecay = elapsedSeconds * (100 / (20 * 3600));
    this.data.love = Math.max(0, Math.min(100, this.data.love - loveDecay));

    this.save();
  }

  feed() {
    this.applyDecay();

    if (this.data.hunger >= 98) {
      return { success: false, reason: 'full', message: `${this.data.name} is too full right now!` };
    }

    this.data.hunger = Math.min(100, this.data.hunger + 35);
    this.data.love = Math.min(100, this.data.love + 10);
    this.data.mealsToday = (this.data.mealsToday || 0) + 1;
    this.data.lastFedTimestamp = Date.now();

    const leveledUp = this.addXP(25);
    this.save();

    return {
      success: true,
      message: `Yum! Fed ${this.data.name}. (Meals today: ${this.data.mealsToday}/3)`,
      leveledUp,
      state: this.getState()
    };
  }

  pet() {
    this.applyDecay();
    const now = Date.now();

    // Minor throttle so spamming doesn't instant-level
    if (now - (this.data.lastPettedTimestamp || 0) < 800) {
      return { success: false, reason: 'too_fast' };
    }

    this.data.lastPettedTimestamp = now;
    this.data.love = Math.min(100, this.data.love + 6);
    const leveledUp = this.addXP(6);
    this.save();

    return {
      success: true,
      leveledUp,
      state: this.getState()
    };
  }

  addXP(amount) {
    if (this.data.friendshipLevel >= 10) return false;

    this.data.friendshipXP = (this.data.friendshipXP || 0) + amount;
    if (this.data.friendshipXP >= XP_PER_LEVEL) {
      this.data.friendshipXP -= XP_PER_LEVEL;
      this.data.friendshipLevel = Math.min(10, (this.data.friendshipLevel || 1) + 1);
      return true;
    }
    return false;
  }

  setCustomization({ name, fur, accessory }) {
    if (name && typeof name === 'string') this.data.name = name.trim().slice(0, 20);
    if (['orange', 'tuxedo', 'calico', 'white'].includes(fur)) this.data.fur = fur;
    if (['bell', 'bow', 'hat', 'none'].includes(accessory)) this.data.accessory = accessory;
    this.save();
    return this.getState();
  }

  toggleMischief(enabled) {
    this.data.mischiefEnabled = Boolean(enabled);
    this.save();
    return this.getState();
  }

  setDismissed(dismissed) {
    this.data.isDismissed = Boolean(dismissed);
    this.save();
    return this.getState();
  }

  getState() {
    this.applyDecay();
    const level = this.data.friendshipLevel || 1;
    const title = FRIENDSHIP_TITLES[Math.min(level - 1, FRIENDSHIP_TITLES.length - 1)];

    return {
      name: this.data.name,
      fur: this.data.fur,
      accessory: this.data.accessory,
      hunger: Math.round(this.data.hunger),
      love: Math.round(this.data.love),
      friendshipLevel: level,
      friendshipXP: Math.round(this.data.friendshipXP),
      friendshipTitle: title,
      xpNeeded: XP_PER_LEVEL,
      mealsToday: this.data.mealsToday || 0,
      mischiefEnabled: this.data.mischiefEnabled !== false,
      isDismissed: Boolean(this.data.isDismissed)
    };
  }

  save() {
    petStorage.save(this.data);
  }
}

module.exports = new PetState();
