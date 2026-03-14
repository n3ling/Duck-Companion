// Ducky Companion - Content Script
// A cute duck that roams around the bottom of web pages

(function() {
  'use strict';

  // Prevent multiple instances
  if (window.duckyCompanionInitialized) return;
  window.duckyCompanionInitialized = true;

  // ==================== Configuration ====================
  const CONFIG = {
    DUCK_SIZE: { width: 80, height: 70 },
    GROUND_HEIGHT: 60,
    SPEED: { walk: 2, run: 5, swim: 1.5 },
    BEHAVIOR_INTERVALS: {
      walk: { min: 2000, max: 5000 },
      nap: { min: 5000, max: 10000 },
      swim: { min: 3000, max: 7000 },
      idle: { min: 1000, max: 3000 }
    },
    INTERACTION_DISTANCE: 100,
    SHOO_DISTANCE: 150
  };

  // ==================== State Management ====================
  const state = {
    mode: 'pet',
    soundEnabled: true,
    duckVisible: true,
    featherColor: '#FFFFFF',
    isInitialized: false,
    position: { x: 100, y: 0 },
    velocity: { x: 0, y: 0 },
    facingLeft: false,
    currentBehavior: 'idle',
    isInteracting: false,
    mousePosition: { x: 0, y: 0 },
    behaviorTimeout: null,
    animationFrame: null,
    eatingCooldownUntil: 0
  };

  // ==================== Audio Context ====================
  let audioContext = null;
  const SOUND_FILES = { quack: 'quack.mp3', happy: 'happy.mp3', eat: 'eat.mp3' };

  function initAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
  }

  function tryPlayCustomSound(filename, fallbackFn) {
    if (!state.soundEnabled) return;
    try {
      const url = chrome.runtime.getURL('sounds/' + filename);
      const audio = new Audio(url);
      let fallbackCalled = false;
      const doFallback = () => {
        if (!fallbackCalled) {
          fallbackCalled = true;
          fallbackFn();
        }
      };
      audio.onerror = doFallback;
      const played = audio.play();
      if (played && typeof played.catch === 'function') {
        played.catch(doFallback);
      }
    } catch (_e) {
      fallbackFn();
    }
  }

  function playQuackSynth() {
    try {
      const ctx = initAudio();
      if (ctx.state === 'suspended') ctx.resume();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(300, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
      setTimeout(() => {
        if (!state.soundEnabled) return;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(280, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.1);
        gain2.gain.setValueAtTime(0.25, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.1);
      }, 120);
    } catch (e) {
      console.log('Ducky: Could not play sound', e);
    }
  }

  function playQuack() {
    if (!state.soundEnabled) return;
    tryPlayCustomSound(SOUND_FILES.quack, playQuackSynth);
  }

  function playHappySynth() {
    try {
      const ctx = initAudio();
      if (ctx.state === 'suspended') ctx.resume();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.log('Ducky: Could not play sound', e);
    }
  }

  function playHappySound() {
    if (!state.soundEnabled) return;
    tryPlayCustomSound(SOUND_FILES.happy, playHappySynth);
  }

  function playEatSynth() {
    try {
      const ctx = initAudio();
      if (ctx.state === 'suspended') ctx.resume();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.log('Ducky: Could not play sound', e);
    }
  }

  function playEatSound() {
    if (!state.soundEnabled) return;
    tryPlayCustomSound(SOUND_FILES.eat, playEatSynth);
  }

  // ==================== Duck SVG ====================
  function createDuckSVG() {
    return `
      <svg class="ducky-svg" viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg">
        <!-- Duck Body (feather colour via CSS variable) -->
        <ellipse class="ducky-main-body" cx="50" cy="50" rx="35" ry="28" fill="var(--duck-feather, #FFFFFF)" stroke="#E0E0E0" stroke-width="1"/>

        <!-- Wing -->
        <ellipse class="ducky-wing" cx="45" cy="48" rx="18" ry="14" fill="var(--duck-feather, #FFFFFF)" stroke="#E0E0E0" stroke-width="0.5"/>

        <!-- Wing detail -->
        <path d="M 35 50 Q 45 55 55 50" stroke="#D0D0D0" stroke-width="1" fill="none"/>

        <!-- Neck -->
        <ellipse cx="75" cy="35" rx="12" ry="18" fill="var(--duck-feather, #FFFFFF)" stroke="#E0E0E0" stroke-width="0.5"/>

        <!-- Head -->
        <circle cx="80" cy="22" r="14" fill="var(--duck-feather, #FFFFFF)" stroke="#E0E0E0" stroke-width="0.5"/>

        <!-- Eye -->
        <g class="ducky-eye">
          <circle cx="83" cy="20" r="4" fill="#333333"/>
          <circle cx="84" cy="19" r="1.5" fill="#FFFFFF"/>
        </g>

        <!-- Beak (orange) -->
        <g class="ducky-beak">
          <ellipse cx="93" cy="26" rx="7" ry="4" fill="#FF8C00"/>
          <path d="M 86 26 L 100 26" stroke="#E07000" stroke-width="0.5"/>
          <ellipse cx="93" cy="28" rx="5" ry="2" fill="#FF7700"/>
        </g>

        <!-- Feet (orange) -->
        <g class="ducky-feet">
          <g class="ducky-foot-left" style="transform-origin: 35px 75px">
            <ellipse cx="35" cy="78" rx="8" ry="3" fill="#FF8C00"/>
            <path d="M 28 78 L 28 82 M 32 78 L 32 83 M 36 78 L 36 82 M 40 78 L 40 83" stroke="#E07000" stroke-width="1.5" stroke-linecap="round"/>
          </g>
          <g class="ducky-foot-right" style="transform-origin: 55px 75px">
            <ellipse cx="55" cy="78" rx="8" ry="3" fill="#FF8C00"/>
            <path d="M 48 78 L 48 82 M 52 78 L 52 83 M 56 78 L 56 82 M 60 78 L 60 83" stroke="#E07000" stroke-width="1.5" stroke-linecap="round"/>
          </g>
        </g>

        <!-- Tail feathers -->
        <path d="M 15 45 Q 8 40 5 45 Q 8 48 15 48" fill="var(--duck-feather, #FFFFFF)" stroke="#E0E0E0" stroke-width="0.5"/>
        <path d="M 15 50 Q 6 48 3 52 Q 8 54 15 52" fill="var(--duck-feather, #FFFFFF)" stroke="#E0E0E0" stroke-width="0.5"/>

        <!-- Blush -->
        <ellipse cx="75" cy="28" rx="4" ry="2" fill="#FFB6C1" opacity="0.5"/>
      </svg>
    `;
  }

  // ==================== DOM Creation ====================
  let duckElement = null;
  let waterGround = null;

  function createDuckElement() {
    // Create main container
    duckElement = document.createElement('div');
    duckElement.className = 'ducky-companion';
    duckElement.id = 'ducky-companion-duck';

    // Create body container
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'ducky-body';
    bodyDiv.innerHTML = createDuckSVG();

    // Create shadow
    const shadow = document.createElement('div');
    shadow.className = 'ducky-shadow';

    // Create ZZZ for napping (hidden by default)
    const zzz = document.createElement('div');
    zzz.className = 'ducky-zzz';
    zzz.textContent = '💤';
    zzz.style.display = 'none';

    // Create hearts for petting (hidden by default)
    const hearts = document.createElement('div');
    hearts.className = 'ducky-hearts';
    hearts.textContent = '❤️';
    hearts.style.display = 'none';

    // Create quack bubble (hidden by default)
    const quackBubble = document.createElement('div');
    quackBubble.className = 'ducky-quack-bubble';
    quackBubble.textContent = 'Quack!';
    quackBubble.style.display = 'none';

    // Assemble
    duckElement.appendChild(shadow);
    duckElement.appendChild(bodyDiv);
    duckElement.appendChild(zzz);
    duckElement.appendChild(hearts);
    duckElement.appendChild(quackBubble);

    // Create water ground effect
    waterGround = document.createElement('div');
    waterGround.className = 'ducky-water-ground';

    // Add to page
    document.body.appendChild(duckElement);
    document.body.appendChild(waterGround);

    applyFeatherColor();
    updateDuckPosition();
  }

  function applyFeatherColor() {
    if (!duckElement) return;
    const body = duckElement.querySelector('.ducky-body');
    if (body) body.style.setProperty('--duck-feather', state.featherColor);
  }

  // ==================== Position Management ====================
  function updateDuckPosition() {
    if (!duckElement) return;

    const groundY = window.innerHeight - CONFIG.GROUND_HEIGHT - CONFIG.DUCK_SIZE.height / 2;

    duckElement.style.left = `${state.position.x}px`;
    duckElement.style.top = `${groundY}px`;
  }

  function clampPosition(x) {
    const padding = CONFIG.DUCK_SIZE.width;
    return Math.max(padding, Math.min(window.innerWidth - padding, x));
  }

  // ==================== Behavior System ====================
  function setBehavior(behavior) {
    if (!duckElement) return;
    if (state.currentBehavior === behavior) return;

    // Remove old behavior classes
    duckElement.classList.remove('idle', 'walking', 'swimming', 'napping', 'eating', 'running', 'scared', 'petting', 'quacking', 'fed');

    // Set new behavior
    state.currentBehavior = behavior;
    duckElement.classList.add(behavior);

    // Handle behavior-specific logic
    switch (behavior) {
      case 'walking':
        startWalking();
        break;
      case 'swimming':
        startSwimming();
        break;
      case 'napping':
        startNapping();
        break;
      case 'eating':
        startEating();
        break;
      case 'idle':
        stopMoving();
        break;
      case 'running':
        startRunning();
        duckElement.classList.add('scared');
        break;
    }
  }

  function stopMoving() {
    state.velocity.x = 0;
    state.velocity.y = 0;
  }

  function startWalking() {
    const direction = Math.random() > 0.5 ? 1 : -1;
    state.velocity.x = direction * CONFIG.SPEED.walk;
    state.facingLeft = direction < 0;
    updateFacingDirection();
  }

  function startSwimming() {
    const direction = Math.random() > 0.5 ? 1 : -1;
    state.velocity.x = direction * CONFIG.SPEED.swim;
    state.facingLeft = direction < 0;
    updateFacingDirection();
    waterGround.classList.add('visible');
  }

  function startNapping() {
    stopMoving();
  }

  function startEating() {
    stopMoving();
  }

  function startRunning() {
    // Run away from mouse
    const dx = state.position.x - state.mousePosition.x;
    const direction = dx > 0 ? 1 : -1;
    state.velocity.x = direction * CONFIG.SPEED.run;
    state.facingLeft = direction < 0;
    updateFacingDirection();
  }

  function updateFacingDirection() {
    if (!duckElement) return;
    if (state.facingLeft) {
      duckElement.classList.add('facing-left');
    } else {
      duckElement.classList.remove('facing-left');
    }
  }

  // ==================== Behavior Scheduling ====================
  function scheduleNextBehavior() {
    if (state.behaviorTimeout) {
      clearTimeout(state.behaviorTimeout);
    }

    const behaviors = ['idle', 'walking', 'swimming', 'napping'];
    const weights = [0.2, 0.4, 0.25, 0.15];

    // Choose behavior based on weights
    let random = Math.random();
    let cumulative = 0;
    let chosenBehavior = 'idle';

    for (let i = 0; i < behaviors.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        chosenBehavior = behaviors[i];
        break;
      }
    }

    // Schedule behavior change (delay before switching to next behavior)
    const interval = CONFIG.BEHAVIOR_INTERVALS[chosenBehavior];
    const delay = interval.min + Math.random() * (interval.max - interval.min);

    state.behaviorTimeout = setTimeout(() => {
      if (!state.isInteracting) {
        setBehavior(chosenBehavior);

        // Schedule how long to do this behavior
        const duration = interval.min + Math.random() * (interval.max - interval.min);
        state.behaviorTimeout = setTimeout(() => {
          scheduleNextBehavior();
        }, duration);
      } else {
        scheduleNextBehavior();
      }
    }, delay);
  }

  // ==================== Interaction Handlers ====================
  function handleMousePosition(e) {
    state.mousePosition.x = e.clientX;
    state.mousePosition.y = e.clientY;

    if (state.mode === 'shoo' && !state.isInteracting) {
      const distance = getDistance(state.position.x, 0, state.mousePosition.x, 0);
      if (distance < CONFIG.SHOO_DISTANCE) {
        setBehavior('running');
        state.isInteracting = true;
      }
    }

    if (state.mode === 'feed') {
      const distance = getDistance(state.position.x, 0, state.mousePosition.x, 0);
      const inCooldown = Date.now() < state.eatingCooldownUntil;
      if (distance < CONFIG.INTERACTION_DISTANCE && state.currentBehavior !== 'eating' && !inCooldown) {
        setBehavior('eating');
        state.isInteracting = true;
        playEatSound();

        // Show eating for a bit, then stop (with cooldown to prevent repeated triggers)
        setTimeout(() => {
          if (state.currentBehavior === 'eating' && duckElement) {
            state.isInteracting = false;
            state.eatingCooldownUntil = Date.now() + 1000;
            duckElement.classList.add('fed');
            setTimeout(() => {
              if (duckElement) duckElement.classList.remove('fed');
              scheduleNextBehavior();
            }, 500);
          }
        }, 2000);
      }
    }
  }

  function handleDuckClick(e) {
    e.preventDefault();
    e.stopPropagation();

    // Quack!
    setBehavior('quacking');
    playQuack();

    // Show quack bubble
    const bubble = duckElement.querySelector('.ducky-quack-bubble');
    bubble.style.display = 'block';

    setTimeout(() => {
      bubble.style.display = 'none';
      duckElement.classList.remove('quacking');
      if (!state.isInteracting) {
        scheduleNextBehavior();
      }
    }, 500);
  }

  function handleDuckHover(_e) {
    if (state.mode === 'pet' && !state.isInteracting) {
      state.isInteracting = true;
      setBehavior('petting');
      playHappySound();

      // Show hearts
      const hearts = duckElement.querySelector('.ducky-hearts');
      hearts.style.display = 'block';

      setTimeout(() => {
        hearts.style.display = 'none';
        duckElement.classList.remove('petting');
        state.isInteracting = false;
        scheduleNextBehavior();
      }, 600);
    }
  }

  function getDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  // ==================== Animation Loop ====================
  function animationLoop() {
    if (!state.duckVisible) {
      state.animationFrame = requestAnimationFrame(animationLoop);
      return;
    }

    // Apply velocity
    if (state.velocity.x !== 0) {
      state.position.x += state.velocity.x;
      state.position.x = clampPosition(state.position.x);

      // Bounce at edges
      if (state.position.x <= CONFIG.DUCK_SIZE.width ||
          state.position.x >= window.innerWidth - CONFIG.DUCK_SIZE.width) {
        state.velocity.x *= -1;
        state.facingLeft = !state.facingLeft;
        updateFacingDirection();
      }

      updateDuckPosition();
    }

    // Check if running away in shoo mode
    if (state.currentBehavior === 'running') {
      const distance = getDistance(state.position.x, 0, state.mousePosition.x, 0);
      if (distance > CONFIG.SHOO_DISTANCE) {
        state.isInteracting = false;
        duckElement.classList.remove('running', 'scared');
        scheduleNextBehavior();
      }
    }

    state.animationFrame = requestAnimationFrame(animationLoop);
  }

  // ==================== Message Handler ====================
  function handleMessage(message) {
    if (!duckElement) return;
    switch (message.type) {
      case 'MODE_CHANGED':
        state.mode = message.mode;
        state.isInteracting = false;

        // Reset cursor based on mode
        if (message.mode === 'feed') {
          duckElement.classList.add('ducky-feed-cursor');
        } else {
          duckElement.classList.remove('ducky-feed-cursor');
        }

        // If switching away from current mode, resume normal behavior
        if (state.currentBehavior === 'running' || state.currentBehavior === 'eating') {
          scheduleNextBehavior();
        }
        break;

      case 'SOUND_CHANGED':
        state.soundEnabled = message.soundEnabled;
        break;

      case 'VISIBILITY_CHANGED':
        state.duckVisible = message.duckVisible;
        if (message.duckVisible) {
          duckElement.classList.remove('hidden');
          waterGround.classList.add('visible');
        } else {
          duckElement.classList.add('hidden');
          waterGround.classList.remove('visible');
        }
        break;

      case 'FEATHER_COLOR_CHANGED':
        state.featherColor = message.featherColor;
        applyFeatherColor();
        break;
    }
  }

  // ==================== Initialization ====================
  async function init() {
    // Load settings (defaults must match background.js)
    try {
      const settings = await chrome.storage.sync.get({
        mode: 'pet',
        soundEnabled: true,
        duckVisible: true,
        featherColor: '#FFFFFF'
      });

      state.mode = settings.mode;
      state.soundEnabled = settings.soundEnabled;
      state.duckVisible = settings.duckVisible;
      state.featherColor = settings.featherColor || '#FFFFFF';
    } catch (e) {
      // Default values if storage not available
    }

    // Set initial position (bottom left of page)
    state.position.x = CONFIG.DUCK_SIZE.width;

    // Create duck
    createDuckElement();

    // Apply initial visibility from saved settings
    if (!state.duckVisible) {
      duckElement.classList.add('hidden');
      waterGround.classList.remove('visible');
    }

    // Event listeners (stored for cleanup)
    document.addEventListener('mousemove', handleMousePosition);
    duckElement.addEventListener('click', handleDuckClick);
    duckElement.addEventListener('mouseenter', handleDuckHover);

    const messageListener = (message) => handleMessage(message);
    chrome.runtime.onMessage.addListener(messageListener);

    const resizeHandler = () => {
      state.position.x = clampPosition(state.position.x);
      updateDuckPosition();
    };
    window.addEventListener('resize', resizeHandler);

    // Start animation loop
    animationLoop();

    // Start behavior scheduling
    scheduleNextBehavior();

    state.isInitialized = true;

    // Cleanup on page unload
    const destroy = () => {
      if (state.behaviorTimeout) {
        clearTimeout(state.behaviorTimeout);
        state.behaviorTimeout = null;
      }
      if (state.animationFrame != null) {
        cancelAnimationFrame(state.animationFrame);
        state.animationFrame = null;
      }
      document.removeEventListener('mousemove', handleMousePosition);
      if (duckElement) {
        duckElement.removeEventListener('click', handleDuckClick);
        duckElement.removeEventListener('mouseenter', handleDuckHover);
        duckElement.remove();
      }
      if (waterGround && waterGround.parentNode) {
        waterGround.remove();
      }
      window.removeEventListener('resize', resizeHandler);
      chrome.runtime.onMessage.removeListener(messageListener);
      duckElement = null;
      waterGround = null;
      window.duckyCompanionInitialized = false;
    };

    window.addEventListener('beforeunload', destroy);
    window.addEventListener('pagehide', destroy);

    console.log('🦆 Ducky Companion initialized!');
  }

  // Start the extension
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
