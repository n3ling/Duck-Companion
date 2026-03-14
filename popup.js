// Popup script for Ducky Companion extension

document.addEventListener('DOMContentLoaded', async () => {
  const modeButtons = document.querySelectorAll('.mode-btn');
  const soundToggle = document.getElementById('soundToggle');
  const visibilityToggle = document.getElementById('visibilityToggle');

  // Load saved settings
  const settings = await chrome.storage.sync.get({
    mode: 'pet',
    soundEnabled: true,
    duckVisible: true
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
