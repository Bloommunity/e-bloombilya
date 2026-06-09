# E-Bloombilya — Virtual Lightstick

This project is now a Nuxt 3 app with Tailwind CSS and GSAP-powered entrance/pulse animations. It keeps the original lightstick behavior:

- On / Off controls
- Image-based color swatches
- Fixed, Random, and Blink modes
- Offline support through a service worker

## Run locally

```bash
npm install
npm run dev
```

Open the local Nuxt URL in your browser. The app can still be installed as a PWA from the browser menu.

## Files

- `pages/index.vue` is the main app UI and behavior
- `assets/css/main.css` contains the global look and fonts
- `public/manifest.webmanifest` and `public/sw.js` keep the PWA behavior

## Notes

- The image assets are served from `public/images` in the Nuxt app.
- GSAP handles the glow entrance and pulse animation on the main lightstick.
