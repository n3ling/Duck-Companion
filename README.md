# 🦆 Ducky Companion

A cute Chrome extension that adds an animated white duck with an orange beak and orange feet to your browser. The duck roams around the bottom of web pages, takes naps, swims, and eats!

## Features

- **Animated Duck Character**: A cute duck (customisable feather colour) with orange beak and feet that starts at the bottom-left of your web pages
- **Natural Behaviors**:
  - 🚶 **Walking**: The duck randomly walks left and right along the bottom of the page
  - 🏊 **Swimming**: The duck floats and paddles with water ripple effects
  - 😴 **Napping**: The duck takes naps with cute "💤" Z's floating above
  - 🍞 **Eating**: The duck pecks at food when fed

## Interaction Modes

Click the extension icon to access three interaction modes:

### ✋ Pet Mode
- Hover over the duck to pet it
- The duck shows happiness with floating hearts ❤️
- Makes a happy chirp sound

### 👋 Shoo Mode
- Move your mouse near the duck to make it run away
- The duck scurries away from your cursor
- Great for playing chase with your duck!

### 🍞 Feed Mode
- Move your mouse near the duck to feed it
- The duck will peck at the food near your cursor
- Makes eating sounds

## Additional Features

- **Click to Quack**: Click on the duck anytime to make it quack!
- **Feather Colour**: Choose a preset feather colour in the popup (Classic White, Cream, Lemon, Peach, Soft Gray, Snow) — all chosen to look good with the orange beak and feet.
- **Custom Sounds**: Optionally add `quack.mp3`, `happy.mp3`, and `eat.mp3` into the `sounds/` folder; if present, they replace the built-in synthesized sounds.
- **Sound Toggle**: Mute/unmute all sounds from the popup
- **Visibility Toggle**: Show/hide the duck on the current page

## Technical Details

- Built with vanilla JavaScript and CSS
- Uses Chrome Extension Manifest V3
- SVG-based duck character for crisp rendering at any size
- Web Audio API for synthesized quack sounds (no external audio files needed)
- CSS animations for smooth, performant animations

## File Structure

```
Duck-Companion/
├── manifest.json      # Extension configuration
├── content.js         # Main duck logic and behavior
├── styles.css         # Duck styling and animations
├── popup.html         # Extension popup UI
├── popup.js           # Popup interaction logic
├── background.js      # Service worker for settings (default settings source of truth)
├── icons/             # Extension icons
│   └── ...
└── sounds/            # Optional: quack.mp3, happy.mp3, eat.mp3 for custom sounds
    └── README.md      # Instructions for custom sounds
```

Built-in sounds are synthesized via the Web Audio API. You can override them by adding MP3 files in `sounds/` (see `sounds/README.md`).

## Development / Testing (no re-upload needed)

You can run and test the extension locally without publishing to the Chrome Web Store:

1. Open Chrome and go to **chrome://extensions/**.
2. Turn on **Developer mode** (toggle in the top-right).
3. Click **Load unpacked**.
4. Select the **Duck-Companion** project folder (the one that contains `manifest.json`).
5. The extension will load and appear in your toolbar. Visit any webpage to see the duck.

After you change code or assets, click the **Reload** button on the extension card at `chrome://extensions` to pick up changes. You do **not** need to remove and re-add the extension.

## Customization

You can modify the duck's behavior by editing the `CONFIG` object in `content.js`:

- `SPEED`: Walking, running, and swimming speeds
- `BEHAVIOR_INTERVALS`: How long each behavior lasts
- `INTERACTION_DISTANCE`: How close the mouse needs to be for interactions
- `GROUND_HEIGHT`: The "water/ground" area height at the bottom of pages

## Permissions

- `storage`: To save your preferences (mode, sound settings)
- `activeTab`: To interact with the current tab

## License

MIT License - Feel free to modify and share!

---

Enjoy your new ducky companion! 🦆
