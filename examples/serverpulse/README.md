# Server Pulse

A Blueprint beta-2026-08 example for Aquadactyl commit
`2bfd6ae2a30c8152b34b53c53562773a973ae901`.

The extension adds a resource monitor under Server → Console using the
`Server.Terminal.AfterContent` hook. It calls the existing authenticated
`GET /api/client/servers/{uuid}/resources` endpoint. No custom backend route,
API key, migration, additional package installation or lifecycle script is needed.

Shared dependencies used: React 19, TanStack Query 5, Axios through `@/api/http`,
Zustand 5, React Hook Form 7, Zod 4 and its resolver, Base UI 1, date-fns 4,
es-toolkit 1, Lucide and Motion 14. Preferences live in memory. Responses are
validated with Zod. The query is scoped by server UUID, forwards cancellation,
does not poll in the background, and does not retry authorization errors.

## Install in a disposable panel

Download `serverpulse.blueprint` from the website's example guide. It is a ZIP
with `conf.yml` at its root. Place it in the panel root and run:

```bash
cd /var/www/aquadactyl
sudo blueprint -check serverpulse
sudo blueprint -i serverpulse
```

For Docker, copy it to the panel container's `/app` directory and run
`docker compose exec panel blueprint -check serverpulse`, then
`docker compose exec panel blueprint -i serverpulse`.

Open a server's Console page and find Server Pulse below the console. Test
refreshing, Settings, invalid/empty labels, keyboard focus, reduced motion, server
navigation and a normal subuser's access. CPU can exceed 100% on multiple cores;
the displayed value is not clamped. Memory is measured in MiB, and the meter is
omitted for unlimited memory. An unavailable node displays the API error; a
previous successful reading is labelled as such.

Remove with `sudo blueprint -r serverpulse --yes`. Keep the original package in
the panel root so managed updates can reapply its hooks.

## Edit and package

Edit the source in `examples/serverpulse` in the website repository, then run:

```bash
node scripts/package-example.mjs
```

This regenerates `public/examples/serverpulse.blueprint` and the source reference
page. The website does not compile this panel-targeted TSX. Validate it using the
target panel's installed dependencies and Blueprint compatibility check before
distribution. Blueprint's check compiles the frontend; it does not verify a live
installation, CSS injection, permissions, node connectivity or removal.

The manifest's `target` is the Blueprint framework version, not a panel version.
`dashboard.components` is a directory; it must contain **Components.yml** with
that exact capitalisation on Linux. Component paths omit their `.tsx` suffix.

Full walkthrough: https://aquadactyl.uk/docs/blueprint/example-extension

## License

MIT; see LICENSE. This example includes no Blueprint artwork.
