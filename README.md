# Aquadactyl website

The project website and operator documentation are hosted at
[https://aquadactyl.uk](https://aquadactyl.uk). This repository contains the React,
TypeScript and Vite application that serves those pages.

## Run locally

Use Node.js 24 and pnpm 11.25.0, as specified in this repository's package.json.
The panel has its own PHP, Node.js and pnpm requirements in the
[panel development guide](https://github.com/Aquadactyl/aquadactyl/blob/main/BUILDING.md).

```bash
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://localhost:5173>. To build and preview production output:

```bash
pnpm build
pnpm preview
```

The production website is generated in dist/. Configure the static host to serve
index.html for application routes, including /docs, /docs/updating and
/docs/blueprint. For Nginx, use `try_files $uri $uri/ /index.html;` in the main
location block. Building locally does not update the hosted website.

## Published guides

| Page                                              | Covers                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [Project website](https://aquadactyl.uk)          | Project overview, interactive sample panel, installation snippets, FAQ and community links |
| [Installation](https://aquadactyl.uk/docs)        | Requirements, source checkout, environment, Nginx/TLS, queue, scheduler and Wings          |
| [Updating](https://aquadactyl.uk/docs/updating)   | Reviewed releases, managed updates, backups and recovery                                   |
| [Blueprint](https://aquadactyl.uk/docs/blueprint) | Bundled framework, extension installation and maintenance                                  |

The panel preview runs with sample data in the browser. Its power controls,
console, file previews, backups and settings demonstrate the interface without
connecting to game server nodes.

## Documentation sources

Use the [Aquadactyl panel repository](https://github.com/Aquadactyl/aquadactyl)
as the source for requirements and commands. Check README.md, BUILDING.md,
docs/DEPLOYMENT.md, docs/BLUEPRINT.md, docs/BRANDING.md and the deployment scripts
when updating src/Documentation.tsx. Project copy is in src/App.tsx; repository
URLs, branch names and shared commands are in src/config.ts.

New installation examples use /var/www/aquadactyl and
/var/backups/aquadactyl. Existing installations can keep their old paths,
credentials and service names. Preserve those compatibility notes when editing
the guides. Keep original upstream credits and license notices.

## Verify changes

```bash
pnpm types
pnpm lint
pnpm format:check
pnpm build
```

Preview /, /docs, /docs/updating and /docs/blueprint after editing navigation or
content. Check section links, copy buttons and the mobile menu. The shared command
snippets must match the panel's scripts and current repository identity.
