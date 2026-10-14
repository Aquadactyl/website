# Aquadactyl website

The project website and operator documentation are hosted at
[https://aquadactyl.uk](https://aquadactyl.uk). This repository contains the React,
TypeScript and Next.js application, with Fumadocs powering the MDX guides.

## Panel features covered

The homepage and [Panel Features guide](https://aquadactyl.uk/docs/panel/features)
describe the current Aquadactyl additions:

- Appearance customisation: site name, logo, primary colour, login layouts,
  backgrounds, blur, overlays and desktop/mobile previews.
- Passkeys and linked Discord, GitHub, Google and OpenID Connect accounts,
  configured by administrators and subject to two-factor verification.
- English, French and German for the client and admin areas, with per-account
  preferences, browser language selection and additional language packs.
- Per-server file trash, restoration and configurable retention, plus console
  log sharing with redaction and links that expire after 24 hours. Both tools
  are disabled by default.
- Player counts, node country flags, server shortcuts, primary-colour graphs,
  UUID copying and a Lucide scroll-to-latest console button.
- SMTP, Mailgun, Postmark and Amazon SES configuration, optional feature
  controls and administrator removal of uploaded profile pictures.
- Bundled Blueprint, an integrated Egg Library, simpler schedules, shared addon
  libraries and managed installation and updates.

## Run locally

Use Node.js 24 and pnpm 11.25.0, as specified in this repository's package.json.
The panel has its own PHP, Node.js and pnpm requirements in the
[panel development guide](https://github.com/Aquadactyl/aquadactyl/blob/main/BUILDING.md).

```bash
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000). To build and run production output:

```bash
pnpm build
pnpm start
```

Next.js builds into `.next/` and runs a Node.js server. Deploy using a host that
supports Next.js or run the server behind a reverse proxy. Building locally does
not update the hosted website.

The documentation's optional AI assistant uses server-side OpenRouter settings
from `.env.example`. Keep API keys in server environment variables.

## Published guides

| Page                                                                        | Covers                                                                                     |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [Project website](https://aquadactyl.uk)                                    | Project overview, interactive sample panel, installation snippets, FAQ and community links |
| [Installation](https://aquadactyl.uk/docs)                                  | Requirements, source checkout, environment, Nginx/TLS, queue, scheduler and Wings          |
| [Updating](https://aquadactyl.uk/docs/updating)                             | Reviewed releases, managed updates, backups and recovery                                   |
| [Blueprint](https://aquadactyl.uk/docs/blueprint/migration)                 | Bundled framework, extension installation, migration and maintenance                       |
| [API reference](https://aquadactyl.uk/docs/api)                             | Client, Application, Wings callback, Blueprint, browser authentication and WebSocket APIs  |
| [Example extension](https://aquadactyl.uk/docs/blueprint/example-extension) | Downloadable Server Pulse package using the panel's shared libraries                       |

The panel preview runs with sample data in the browser. Its power controls,
console, file previews, backups and settings demonstrate the interface without
connecting to game server nodes.

## Documentation sources

Use the [Aquadactyl panel repository](https://github.com/Aquadactyl/aquadactyl)
as the source for feature behaviour, requirements and commands. Check `README.md`,
`BUILDING.md`, `config/aquadactyl.php`, the relevant guides under `docs/`, and the
deployment scripts when updating website copy.

Homepage feature copy lives in `src/components/Home.tsx`, the sample panel in
`src/components/PanelPreview.tsx`, and site metadata in `src/app/layout.tsx`.
Operator guides are MDX files under `docs/`; navigation order is defined by each
folder's `meta.json`.

The API reference is generated from a reviewed panel checkout, with its commit
pinned in every generated page and `public/api/reference.json`. To refresh it:

```bash
node scripts/generate-api-docs.mjs /path/to/aquadactyl
pnpm exec oxfmt --write docs/api public/api/reference.json
```

Review the handwritten API guides and extension compatibility when updating the
snapshot. The generator checks coverage of all three core route files. Its JSON
output is a route/validation inventory, not an OpenAPI specification.

The editable Blueprint example lives in `examples/serverpulse`. It compiles
against the panel, so it is excluded from the website's TypeScript project.
Recreate its downloadable `.blueprint` ZIP, SHA-256 file and full source page with:

```bash
node scripts/package-example.mjs
```

Run `blueprint -check serverpulse` in the matching panel checkout, then install,
exercise and remove it in a disposable panel before releasing modifications.

Document optional tools' defaults and administrator settings accurately. Keep
extension compatibility notes and distinguish the sample preview from the live
panel.

New installation examples use /var/www/aquadactyl and
/var/backups/aquadactyl. Existing installations can keep their old paths,
credentials and service names. Preserve those compatibility notes when editing
the guides. Keep original upstream credits and license notices.

## Verify changes

```bash
pnpm exec next typegen
pnpm types
pnpm lint
pnpm format:check
pnpm build
node scripts/verify-api-docs.mjs
```

Preview `/`, `/docs/panel/features`, `/docs/panel`, `/docs/blueprint/migration`
and `/tools/blueprint-migrator` after editing navigation or content. Check feature
links, section anchors and the mobile menu. Commands and feature behaviour must
match the panel's current implementation.
