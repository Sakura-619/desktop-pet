// Corner Control Panel UI Logic

let currentState = {};

// UI Elements
const mainCard = document.getElementById('main-card');
const miniBadge = document.getElementById('mini-badge');
const btnCollapse = document.getElementById('btn-collapse');

const uiPetName = document.getElementById('ui-pet-name');
const uiFriendshipBadge = document.getElementById('ui-friendship-badge');
const uiHungerText = document.getElementById('ui-hunger-text');
const barHunger = document.getElementById('bar-hunger');
const uiLoveText = document.getElementById('ui-love-text');
const barLove = document.getElementById('bar-love');
const uiXpText = document.getElementById('ui-xp-text');
const barXp = document.getElementById('bar-xp');

const btnFeed = document.getElementById('btn-feed');
const btnPet = document.getElementById('btn-pet');
const btnDismiss = document.getElementById('btn-dismiss');
const dismissIcon = document.getElementById('dismiss-icon');
const dismissLabel = document.getElementById('dismiss-label');
const btnCustomize = document.getElementById('btn-customize');

const chkMischief = document.getElementById('chk-mischief');
const btnTriggerMischief = document.getElementById('btn-trigger-mischief');

// Customization Modal Elements
const customModal = document.getElementById('custom-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnSaveCustom = document.getElementById('btn-save-custom');
const inputName = document.getElementById('input-name');
const furChips = document.querySelectorAll('#fur-options .option-chip');
const accChips = document.querySelectorAll('#acc-options .option-chip');

let selectedFur = 'orange';
let selectedAcc = 'bell';

// Toggle Widget Collapse / Expand
btnCollapse.addEventListener('click', () => {
  mainCard.style.display = 'none';
  miniBadge.style.display = 'flex';
  if (window.electronAPI) {
    window.electronAPI.setWidgetSize(70, 70);
  }
});

miniBadge.addEventListener('click', () => {
  miniBadge.style.display = 'none';
  mainCard.style.display = 'flex';
  if (window.electronAPI) {
    window.electronAPI.setWidgetSize(310, 370);
  }
});

// Update UI from PetState
function renderState(state) {
  if (!state) return;
  currentState = state;

  uiPetName.textContent = state.name || 'Mochi';
  uiFriendshipBadge.textContent = `⭐ Lvl ${state.friendshipLevel} • ${state.friendshipTitle}`;

  // Hunger
  uiHungerText.textContent = `${state.hunger}% (Meals: ${state.mealsToday}/3)`;
  barHunger.style.width = `${state.hunger}%`;

  // Love
  uiLoveText.textContent = `${state.love}%`;
  barLove.style.width = `${state.love}%`;

  // XP
  uiXpText.textContent = `${state.friendshipXP} / ${state.xpNeeded}`;
  barXp.style.width = `${(state.friendshipXP / state.xpNeeded) * 100}%`;

  // Mischief Checkbox
  chkMischief.checked = state.mischiefEnabled !== false;

  // Dismiss / Call Status
  if (state.isDismissed) {
    dismissIcon.textContent = '🐾';
    dismissLabel.textContent = 'Call Cat';
  } else {
    dismissIcon.textContent = '🛏️';
    dismissLabel.textContent = 'Snooze';
  }
}

// Action Button Handlers
btnFeed.addEventListener('click', () => {
  if (window.electronAPI) {
    window.electronAPI.feedCat();
  }
});

btnPet.addEventListener('click', () => {
  if (window.electronAPI) {
    window.electronAPI.petCat();
  }
});

btnDismiss.addEventListener('click', () => {
  if (window.electronAPI) {
    window.electronAPI.toggleDismiss();
  }
});

chkMischief.addEventListener('change', (e) => {
  if (window.electronAPI) {
    window.electronAPI.toggleMischief(e.target.checked);
  }
});

btnTriggerMischief.addEventListener('click', () => {
  if (window.electronAPI) {
    window.electronAPI.triggerMischief();
  }
});

// Customization Modal Logic
btnCustomize.addEventListener('click', () => {
  inputName.value = currentState.name || 'Mochi';
  selectedFur = currentState.fur || 'orange';
  selectedAcc = currentState.accessory || 'bell';

  furChips.forEach(chip => {
    chip.classList.toggle('selected', chip.dataset.value === selectedFur);
  });
  accChips.forEach(chip => {
    chip.classList.toggle('selected', chip.dataset.value === selectedAcc);
  });

  customModal.classList.add('visible');
});

btnCloseModal.addEventListener('click', () => {
  customModal.classList.remove('visible');
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

btnSaveCustom.addEventListener('click', () => {
  const newName = inputName.value.trim() || 'Mochi';
  if (window.electronAPI) {
    window.electronAPI.setCustomization({
      name: newName,
      fur: selectedFur,
      accessory: selectedAcc
    });
  }
  customModal.classList.remove('visible');
});

// Connect to Electron IPC
if (window.electronAPI) {
  window.electronAPI.onCatState((state) => {
    renderState(state);
  });
}
