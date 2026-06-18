# E-Bloombilya — Virtual Lightstick

This project is now a Nuxt 3 app with Tailwind CSS and GSAP-powered entrance/pulse animations. It keeps the original lightstick behavior and adds a new music sync feature:

- On / Off controls
- Image-based color swatches
- Fixed, Random, and Blink modes
- **NEW: Music sync mode** - sync lightstick effects with sound on your device
- Offline support through a service worker

## Features

### Music Sync Mode

Listen to any sound on your device and sync the lightstick effects with it:

- **Device Audio Input**: Uses microphone to capture audio from your device (speakers or music playing)
- **Three Sync Modes**:
    - **Beat Mode**: Lightstick flashes with bass beats
    - **Energy Mode**: Colors respond to overall audio energy level
    - **Rainbow Mode**: Colors cycle with frequency spectrum
- **Real-time Analysis**: Continuous beat detection and color mapping
- **PWA Only**: Requires the app to be installed or run via HTTPS (for microphone permissions)

## Run locally

```bash
npm install
npm run dev
```

Open the local Nuxt URL in your browser. The app can still be installed as a PWA from the browser menu.

### Music Sync Setup

1. Select the **Music** mode from the controls
2. Click **"🎤 Start Listening"**
3. Allow microphone access when prompted
4. Play music or audio on your device
5. The lightstick will react to the sound in real-time!

## Files

- `pages/index.vue` is the main app UI and behavior
- `components/` contains all UI components
- `composables/useLightstickApp.ts` manages lightstick state and modes
- `composables/useAudioAnalyzer.ts` analyzes audio for beat detection
- `composables/useMusicSync.ts` orchestrates music sync effects with device audio
- `assets/css/main.css` contains the global look and fonts
- `public/manifest.webmanifest` and `public/sw.js` keep the PWA behavior

## Notes

- The image assets are served from `public/images` in the Nuxt app.
- GSAP handles the glow entrance and pulse animation on the main lightstick.
- Music sync uses Web Audio API for real-time beat detection from device audio input.
- Microphone access requires either HTTPS or local development (http://localhost).
