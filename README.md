# Seattle Deckbuilder

A Seattle-themed deckbuilder, still on the way. The site is a small React app with a placeholder page until the game itself exists.

Live site, once Pages is enabled: [https://homekhomek.github.io/SeattleDeckbuilder/](https://homekhomek.github.io/SeattleDeckbuilder/)

## Run locally

Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:5173/SeattleDeckbuilder/](http://localhost:5173/SeattleDeckbuilder/).

Production build, the same output GitHub Pages serves:

```bash
npm run build
npm run preview
```

The preview is served at [http://localhost:4173/SeattleDeckbuilder/](http://localhost:4173/SeattleDeckbuilder/). `vite.config.js` sets `base` to `/SeattleDeckbuilder/` so asset paths work on the project site, in dev, and in preview.

## Edit the page

Copy lives in `src/site.js` (title, tagline, coming soon text, and the three cards). Layout and colors live in `src/index.css`, on a 1280×800 board that scales to the window. `src/App.jsx` places those pieces.

## Deploy

Pushes to `main` run [`.github/workflows/pages.yml`](.github/workflows/pages.yml). The workflow installs dependencies, runs `npm run build`, uploads `dist/` with the official Pages actions, and deploys it.

The workflow can also be started by hand from the Actions tab.

### One-time setup

In the repository on GitHub, open **Settings > Pages** and set **Source** to **GitHub Actions** if it is not already. After that, a push to `main` publishes the site. The first successful deploy may take a minute before the URL responds.
