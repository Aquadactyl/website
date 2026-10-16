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

## Verify changes

The homepage feature cards and comparison table share `src/lib/panel-features.ts`.
Its source revisions identify the reviewed stock panels. The homepage has one
compact benchmark section with **Panel vs Pterodactyl** and **Wings vs Manta**
comparison buttons, each showing three fixed measurements. It imports only
`public/benchmarks/comparison-summary.json`. Full results and methodology live in
`docs/panel/panel-comparison.mdx` and `docs/wings/benchmarks.mdx`.

Refresh both comparisons sequentially, with no other benchmark jobs running.
Build both panel frontends from their locked dependencies first. The runtime
preparation script accepts `--include-working-tree` to record local changes,
their hashes and an exact Git patch without changing the checkout's Git index.

```bash
node scripts/prepare-runtime-benchmark.mjs /path/to/aquadactyl /path/to/pterodactyl --include-working-tree
docker compose -f WORKDIR/compose.json up -d --build --wait --wait-timeout 240
node scripts/benchmark-runtime.mjs WORKDIR public/benchmarks/panel-comparison.json
# Copy WORKDIR/aquadactyl-source.patch to public/benchmarks/panel-comparison-aquadactyl.patch.
node scripts/write-runtime-benchmark-guide.mjs panel-comparison
node scripts/verify-runtime-benchmark.mjs panel-comparison
docker compose -f WORKDIR/compose.json down --volumes
```

Use the guarded Manta repository runner on its dedicated local benchmark nodes
to collect lifecycle, performance, resources and security phases into a fresh
output directory. It starts/stops only the four provisioned benchmark games.
Rebuild Manta before the run and use the recorded stock Wings release/image.
See the daemon methodology for topology, quotas and limitations. Then package
only the credential-free results and regenerate the small homepage dataset:

```bash
node scripts/publish-daemon-benchmark.mjs /path/to/manta /path/to/fresh-results
node scripts/write-comparison-showcase.mjs
node scripts/verify-comparison-data.mjs
node scripts/verify-runtime-showcase.mjs http://localhost:3000
```

The older frontend build, runtime and before/after optimization reports remain
historical documentation. They are not separate homepage sections. Their
original source revisions and measurement dates are retained. The frontend
report covers build duration and emitted dashboard JS/CSS, including separately
emitted CSS for asset accounting.

With locked dependencies installed in clean panel checkouts, refresh the results:

```bash
node scripts/benchmark-panels.mjs /path/to/aquadactyl /path/to/pterodactyl
node scripts/verify-panel-showcase.mjs
```

The runner uses one warm-up and five measured production builds per panel in
alternating order. It writes the raw report, build log and benchmark guide.
For documentation-only updates to an existing report, run
`node scripts/write-benchmark-guide.mjs`. The report's original measurement date
stays attached to its results.

Runtime measurements use separate disposable Docker stacks with matching data
and resource limits. They cover real Chromium dashboard loads, two authenticated
API endpoints at three concurrency levels, and idle/loaded container working set.
The existing local panel and Wings/Manta stacks are not used by these tests.
Do not run other benchmarks concurrently. See the [runtime methodology](docs/panel/runtime-benchmarks.mdx)
for the measured configuration, limitations and full reproduction commands.

```bash
pnpm exec playwright install chromium
node scripts/prepare-runtime-benchmark.mjs /path/to/aquadactyl /path/to/pterodactyl
# Use the temporary directory printed above as WORKDIR.
docker compose -f WORKDIR/compose.json up -d --build --wait --wait-timeout 240
node scripts/benchmark-runtime.mjs WORKDIR
node scripts/write-runtime-benchmark-guide.mjs
node scripts/verify-runtime-benchmark.mjs
docker compose -f WORKDIR/compose.json down --volumes
```

Build `aquadactyl:test` from the pinned Aquadactyl checkout first; the harness uses
it as a common PHP/OS base for both panels. It serves each checkout's own source,
locked Composer dependencies and prebuilt frontend assets from `/bench`.
`public/benchmarks/runtime.json` contains all samples; `runtime-summary.json`
contains only the chart aggregates so raw latency arrays are not bundled into
the homepage.

With the website running, check both comparison buttons, displayed values,
methodology links, keyboard interaction and compact desktop/mobile layouts with:

```bash
node scripts/verify-runtime-showcase.mjs http://localhost:3000
```

The Aquadactyl optimization experiment uses two checkouts at the same base
commit. Its candidate overlays a recorded patch; it writes a separate result
file so the pinned Pterodactyl comparison stays reproducible. See
`docs/panel/optimization-benchmarks.mdx` for the patch and full commands:

```bash
node scripts/prepare-optimization-benchmark.mjs /path/to/baseline /path/to/candidate
docker compose -f WORKDIR/compose.json up -d --build --wait --wait-timeout 240
node scripts/benchmark-runtime.mjs WORKDIR public/benchmarks/aquadactyl-optimization.json
node scripts/write-optimization-guide.mjs
node scripts/verify-optimization-benchmark.mjs
docker compose -f WORKDIR/compose.json down --volumes
```

Collect the optional `scripts/runtime-benchmark/profile-server-list.php` query
diagnostic after timed measurements. The script is guarded to run only against
the disposable benchmark fixture; it normalizes the fixture token's last-used
timestamp before profiling. Preserve per-file hashes and the exact runner source
with new results.

```bash
pnpm exec next typegen
pnpm types
pnpm lint
pnpm format:check
pnpm build
node scripts/verify-api-docs.mjs
node scripts/verify-panel-showcase.mjs
node scripts/verify-runtime-benchmark.mjs
```

Preview `/`, `/docs/panel/features`, `/docs/panel/benchmarks`,
`/docs/panel/runtime-benchmarks`, `/docs/panel`,
`/docs/blueprint/migration` and `/tools/blueprint-migrator` after editing navigation
or content. Check feature links, section anchors and the mobile menu. Commands
and feature behaviour must match the panel's current implementation.
