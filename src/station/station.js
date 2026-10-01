// Corner Station Base Logic

let currentState = {};
let selectedBed = 'donut';
let selectedFur = 'cream';
let selectedAcc = 'goggles';

// Elements
const uiPetName = document.getElementById('ui-pet-name');
const uiBadge = document.getElementById('ui-friendship-badge');
const catLocationStatus = document.getElementById('cat-location-status');
const foodStatusSub = document.getElementById('food-status-sub');

const barHunger = document.getElementById('bar-hunger');
const uiHungerText = document.getElementById('ui-hunger-text');
const barLove = document.getElementById('bar-love');
const uiLoveText = document.getElementById('ui-love-text');
const barEnergy = document.getElementById('bar-energy');
const uiEnergyText = document.getElementById('ui-energy-text');

const svgDonutBed = document.getElementById('svg-donut-bed');
const svgStrawberryBed = document.getElementById('svg-strawberry-bed');
const bedLabel = document.getElementById('bed-label');

const btnFeed = document.getElementById('btn-feed');
const itemFood = document.getElementById('item-food');
const btnRest = document.getElementById('btn-rest');
const itemBed = document.getElementById('item-bed');
const restIcon = document.getElementById('rest-icon');
const restText = document.getElementById('rest-text');
const btnStyle = document.getElementById('btn-style');
const btnMischief = document.getElementById('btn-mischief');

const btnMinimize = document.getElementById('btn-minimize');
const btnClose = document.getElementById('btn-close');

// Modal
const customModal = document.getElementById('custom-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnSaveUpgrades = document.getElementById('btn-save-upgrades');
const inputPetName = document.getElementById('input-pet-name');

const bedChips = document.querySelectorAll('#bed-options .chip-opt');
const furChips = document.querySelectorAll('#fur-options .chip-opt');
const accChips = document.querySelectorAll('#acc-options .chip-opt');

function renderState(state) {
  if (!state) return;
  currentState = state;

  uiPetName.textContent = state.name || 'Mochi';
  uiBadge.textContent = `⭐ Lvl ${state.friendshipLevel} • ${state.friendshipTitle}`;

  // Hunger (3 meals a day)
  uiHungerText.textContent = `${state.hunger}% (${state.mealsToday}/3)`;
  barHunger.style.width = `${state.hunger}%`;

  // Love
  uiLoveText.textContent = `${state.love}%`;
  barLove.style.width = `${state.love}%`;

  // Energy
  const energy = state.energy !== undefined ? state.energy : 100;
  uiEnergyText.textContent = `${energy}%`;
  barEnergy.style.width = `${energy}%`;

  // Cat Bed Visual (Donut vs Strawberry)
  if (state.bedStyle === 'strawberry') {
    svgDonutBed.style.display = 'none';
    svgStrawberryBed.style.display = 'block';
    bedLabel.textContent = '🍓 Strawberry Bed';
  } else {
    svgDonutBed.style.display = 'block';
    svgStrawberryBed.style.display = 'none';
    bedLabel.textContent = '🛏️ Plush Bed';
  }

  // Location / Sleep state
  if (state.isSleeping) {
    catLocationStatus.textContent = '💤 Resting in Bed';
    catLocationStatus.style.color = '#6c5ce7';
    restIcon.textContent = '☀️';
    restText.textContent = 'Wake Cat';
  } else {
    catLocationStatus.textContent = '🐾 Roaming Monitor';
    catLocationStatus.style.color = '#747d8c';
    restIcon.textContent = '🛏️';
    restText.textContent = 'Call to Bed';
  }
}

// Action: Pour Food
function handleFeed() {
  foodStatusSub.textContent = 'Pouring... 🐟';
  if (window.electronAPI) {
    window.electronAPI.feedCat();
  }
  setTimeout(() => {
    foodStatusSub.textContent = 'Click to Pour';
  }, 3000);
}

btnFeed.addEventListener('click', handleFeed);
itemFood.addEventListener('click', handleFeed);

// Action: Bed / Rest
function handleRest() {
  if (window.electronAPI) {
    window.electronAPI.toggleRest();
  }
}

btnRest.addEventListener('click', handleRest);
itemBed.addEventListener('click', handleRest);

// Action: Mischief
btnMischief.addEventListener('click', () => {
  if (window.electronAPI) {
    window.electronAPI.triggerMischief();
  }
});

// Window Controls
btnMinimize.addEventListener('click', () => {
  if (window.electronAPI) window.electronAPI.minimizeWindow();
});

btnClose.addEventListener('click', () => {
  if (window.electronAPI) window.electronAPI.closeWindow();
});

// Modal Logic
btnStyle.addEventListener('click', () => {
  inputPetName.value = currentState.name || 'Mochi';
  selectedBed = currentState.bedStyle || 'donut';
  selectedFur = currentState.fur || 'cream';
  selectedAcc = currentState.accessory || 'goggles';

  bedChips.forEach(c => c.classList.toggle('selected', c.dataset.value === selectedBed));
  furChips.forEach(c => c.classList.toggle('selected', c.dataset.value === selectedFur));
  accChips.forEach(c => c.classList.toggle('selected', c.dataset.value === selectedAcc));

  customModal.classList.add('visible');
});

btnCloseModal.addEventListener('click', () => {
  customModal.classList.remove('visible');
});

bedChips.forEach(chip => {
  chip.addEventListener('click', () => {
    bedChips.forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    selectedBed = chip.dataset.value;
  });
});

furChips.forEach(chip => {
  chip.addEventListener('click', () => {
    furChips.forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    selectedFur = chip.dataset.value;
  });
});

accChips.forEach(chip => {
  chip.addEventListener('click', () => {
    accChips.forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    selectedAcc = chip.dataset.value;
  });
});

btnSaveUpgrades.addEventListener('click', () => {
  const newName = inputPetName.value.trim() || 'Mochi';
  if (window.electronAPI) {
    window.electronAPI.setCustomization({
      name: newName,
      bedStyle: selectedBed,
      fur: selectedFur,
      accessory: selectedAcc
    });
  }
  customModal.classList.remove('visible');
});

// IPC Listener
if (window.electronAPI) {
  window.electronAPI.onCatState((state) => {
    renderState(state);
  });
}
