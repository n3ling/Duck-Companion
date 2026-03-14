// Popup script for Ducky Companion extension
// Default fallbacks must match background.js (source of truth for install defaults).

document.addEventListener('DOMContentLoaded', async () => {
  const modeButtons = document.querySelectorAll('.mode-btn');
  const soundToggle = document.getElementById('soundToggle');
  const visibilityToggle = document.getElementById('visibilityToggle');

  // Preset feather colours (work well with orange beak and feet)
  const FEATHER_PRESETS = [
    { name: 'Classic White', hex: '#FFFFFF' },
    { name: 'Cream', hex: '#FFF8E7' },
    { name: 'Lemon', hex: '#FFF9C4' },
    { name: 'Peach', hex: '#FFE0B2' },
    { name: 'Soft Gray', hex: '#EEEEEE' },
    { name: 'Snow', hex: '#FFFAF0' }
  ];

  // Load saved settings
  const settings = await chrome.storage.sync.get({
    mode: 'pet',
    soundEnabled: true,
    duckVisible: true,
    featherColor: '#FFFFFF'
  });

  // Apply saved mode
  modeButtons.forEach(btn => {
    if (btn.dataset.mode === settings.mode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Apply sound setting
  if (settings.soundEnabled) {
    soundToggle.classList.add('active');
  } else {
    soundToggle.classList.remove('active');
  }

  // Apply visibility setting
  if (settings.duckVisible) {
    visibilityToggle.classList.add('active');
  } else {
    visibilityToggle.classList.remove('active');
  }

  // Feather colour swatches
  const colorSwatches = document.getElementById('colorSwatches');
  const currentFeather = settings.featherColor || '#FFFFFF';
  FEATHER_PRESETS.forEach((preset) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'color-swatch' + (preset.hex.toUpperCase() === currentFeather.toUpperCase() ? ' active' : '');
    btn.style.backgroundColor = preset.hex;
    btn.title = preset.name;
    btn.dataset.color = preset.hex;
    btn.setAttribute('aria-label', preset.name);
    colorSwatches.appendChild(btn);
  });

  // Mode button click handlers
  modeButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const mode = btn.dataset.mode;
      
      // Update UI
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Save setting
      await chrome.storage.sync.set({ mode });

      // Notify content script
      sendMessageToActiveTab({ type: 'MODE_CHANGED', mode });
    });
  });

  // Sound toggle handler
  soundToggle.addEventListener('click', async () => {
    soundToggle.classList.toggle('active');
    const soundEnabled = soundToggle.classList.contains('active');

    // Save setting
    await chrome.storage.sync.set({ soundEnabled });

    // Notify content script
    sendMessageToActiveTab({ type: 'SOUND_CHANGED', soundEnabled });
  });

  // Visibility toggle handler
  visibilityToggle.addEventListener('click', async () => {
    visibilityToggle.classList.toggle('active');
    const duckVisible = visibilityToggle.classList.contains('active');

    // Save setting
    await chrome.storage.sync.set({ duckVisible });

    // Notify content script
    sendMessageToActiveTab({ type: 'VISIBILITY_CHANGED', duckVisible });
  });

  // Feather colour click handlers
  colorSwatches.querySelectorAll('.color-swatch').forEach((swatch) => {
    swatch.addEventListener('click', async () => {
      const featherColor = swatch.dataset.color;
      colorSwatches.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('active'));
      swatch.classList.add('active');
      await chrome.storage.sync.set({ featherColor });
      sendMessageToActiveTab({ type: 'FEATHER_COLOR_CHANGED', featherColor });
    });
  });
});

// Helper function to send message to active tab
async function sendMessageToActiveTab(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, message);
    } catch (e) {
      // Tab might not have the content script loaded
      console.log('Could not send message to tab');
    }
  }
}
