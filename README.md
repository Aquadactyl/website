# Aquadactyl website

The project website and operator documentation are hosted at
[https://aquadactyl.uk](https://aquadactyl.uk). This repository contains the React,
TypeScript and Next.js application, with Fumadocs powering the MDX guides.

## Panel features covered

The installation guides pin Panel and Manta `v1.2-beta`, with Installer
`v1.4-beta` for reproducible installations and updates. Future betas advance the minor version,
starting with `v1.3-beta`. Current feature coverage includes the setup wizard, configurable
PWA, personal notification subscriptions, status page, Discord roles, audit logs,
maintenance, server subdomains and admin Blueprint management. Benchmark dates
and source revisions remain attached to their original measured runs.

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

Homepage feature data lives in `src/lib/panel-features.ts`, with its cards and
comparison table in `src/components/FeatureComparison.tsx`. The sample panel is
in `src/components/PanelPreview.tsx`, and site metadata in `src/app/layout.tsx`.
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

## Benchmarks and verification

The homepage reads only the compact `public/benchmarks/comparison-summary.json`.
The November 20, 2026 refresh compares Aquadactyl/Manta v1.2-beta, Wings v1.13.5,
Pterodactyl Panel v1.15.2 and Panel v2.0.0-beta.3. Full dated reports, exact
measured runners and setup provenance live under `public/benchmarks/`.
Older reports remain historical; never mix their timings or source revisions
with a current run. The panel v1/v2 pages select from the same three-panel run.

Use clean release checkouts and unmodified lockfiles. The build runner accepts
a JSON configuration listing three source roots, exact SHAs, releases,
package-manager executables/arguments, lockfile names, asset directories and an
output directory. Install dependencies before timing, then run it in a common
four-core, 8 GiB Linux container. It records a discarded warm-up and five full
CLI builds per product, all-route JS/CSS hashes, logs and its exact source.
Copy the measured production assets back to each isolated checkout.

`scripts/prepare-panel-suite.mjs` prepares three disposable PHP 8.4 stacks
with matching limits. Read its arguments and use a unique `BENCHMARK_PROJECT`.

```bash
node scripts/benchmark-builds.mjs /private/build-config.json
docker build -f scripts/runtime-benchmark/Dockerfile.runtime -t aquadactyl-current-bench-runtime:php84 scripts/runtime-benchmark
node scripts/prepare-panel-suite.mjs /sources/aquadactyl /sources/pterodactyl-v1 /sources/pterodactyl-v2
docker compose -f PANEL_WORK/compose.json up -d --build --wait --wait-timeout 300
node scripts/benchmark-panel-suite.mjs PANEL_WORK RESULTS/panels.json
```

Run the separate [daemon suite](scripts/daemon-suite/README.md) only after the
panel measurements finish. Its private nested engine uses four dedicated game
fixtures and no published host ports. Keep account passwords, node tokens,
Compose files and generated private state outside this repository.

After both suites complete, collect final source/provenance and publish:

```bash
node scripts/collect-benchmark-setup.mjs PANEL_WORK DAEMON_WORK RESULTS
node scripts/publish-benchmark-refresh.mjs RESULTS
node scripts/verify-comparison-data.mjs
node scripts/verify-panel-showcase.mjs
pnpm lint
pnpm build
pnpm types
node scripts/verify-runtime-showcase.mjs http://localhost:3000
```

The publisher refuses missing samples, source/build mismatches, overlapping
workloads, API errors or failed integrity checks. It regenerates all four
current guides and the small homepage dataset from completed results. Keep
dated raw files byte-for-byte; formatting them changes their hashes. Historical
coverage/security reports are not represented as fresh performance validation.

The original two-panel build/runtime publishers remain for reproducing archived
runs. They write older canonical filenames and must not overwrite the current
three-panel refresh.

Feature data remains in `src/lib/panel-features.ts`; API references are generated
separately. Run `node scripts/verify-api-docs.mjs` when changing those references.
Preview the homepage at desktop and mobile widths and check the four benchmark
guides, raw downloads and feature links before publishing.
