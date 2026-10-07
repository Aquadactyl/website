# Aquadactyl website

The Aquadactyl project and installation website, built for Euphoria Development. React, TypeScript and Vite, with the black, gray and blue styling of the Euphoria website, its official logo, and self-hosted IBM Plex Sans, Space Grotesk and JetBrains Mono fonts.

## Run locally

Use Node.js 22.13 or later.

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The dev server listens on loopback by default.

```bash
npm run build
npm run preview
```

The production website is generated in `dist/`. Configure your static host to serve `index.html` for application routes, including `/docs`, `/docs/updating`, and `/docs/blueprint`. For Nginx, use `try_files $uri $uri/ /index.html;` in the site's main location block.

## Pages and functionality

- `/`: project overview, interactive server preview, Blueprint extension links, installation snippets, FAQ and community links.
- `/docs`: prerequisites, source checkout, environment configuration, installation, admin creation, Nginx/TLS, queue, scheduler and Wings.
- `/docs/updating`: reviewed releases, managed updates, backups and recovery.
- `/docs/blueprint`: bundled framework, extension installation, package retention and maintenance.

The panel preview uses sample data in the browser. Power controls, console commands, file navigation, sample backups and server-name changes are interactive. It does not connect to a live panel. Type `help`, `list`, `status`, `say <message>`, `clear` or `stop` in the console. Start and stop controls also update the displayed server state and resource usage.

## Source of project information

The copy and installation guides were checked against `C:\Users\rep\Downloads\panel`, especially `README.md`, `docs/DEPLOYMENT.md`, `docs/BLUEPRINT.md`, and the installation/update scripts. The reference panel repository was read without modification.

Repository and community URLs and shared command snippets are maintained in `src/config.ts`. The repository URL uses the panel checkout's actual Git remote, `EuphoriaTheme/aquadactyl`. Keep the guides in sync with panel requirements and deployment scripts when those change.

The visual references were [Pterodactyl](https://pterodactyl.io/) and [Euphoria Development](https://euphoriadevelopment.uk/). The layout uses Euphoria's compact navigation, centered introduction, grid background, blue buttons and neutral project cards. Copy describes the project and installation directly. The Euphoria assets in `public/brand/` come from the official website's `/images/euphoria.png` and `/favicon-96x96.png`. Fonts are bundled locally through Fontsource. The panel demo uses the slate colors of the source panel. The site credits Pterodactyl and Blueprint and identifies Aquadactyl as an independent fork.

## Verify

The published addon artwork in `public/blueprints/` comes from the Euphoria catalogue served by `https://api.euphoriadevelopment.uk/stats/`, using the original images at `https://s3.blueprint.zip/extensions/refreshtheme.jpeg`, `https://s3.blueprint.zip/extensions/resourcemanager.jpeg` and `https://s3.blueprint.zip/extensions/laravellogs.jpeg`.

```bash
npm run build
npx playwright install chromium
npm run test:browser
npm run format:check
```

The browser checks start a local server if needed and cover console commands, power transitions, file previews, backup creation, settings, clipboard copying, documentation routes, mobile navigation, keyboard controls, 24 responsive layout checks, and automated WCAG 2.1 AA accessibility checks. Screenshots and the browser report are written to ignored `artifacts/`. A browser check failure is returned as a non-zero exit code.

For an already running production preview, set `PREVIEW_URL` to its URL before running `npm run test:browser`. On Windows, the browser script can fall back to installed Microsoft Edge if Playwright Chromium is unavailable.
