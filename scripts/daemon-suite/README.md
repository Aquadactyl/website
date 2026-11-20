# Current-release daemon comparison

This harness measures unmodified Manta and Wings release tags. It uses a private
Docker-in-Docker engine with no published host ports. The engine is privileged
for nested containers, but never receives the workstation Docker socket. Use an
isolated benchmark workstation; this is not an installer for an existing node.

Requirements: Docker, Git, Node 24, clean Manta and Wings source checkouts, and
the disposable three-panel stacks created by `../prepare-panel-suite.mjs`.
**Complete the panel measurements first**: provisioning adds separate daemon
fixtures to the Aquadactyl and Pterodactyl v1 databases.

Create a private JSON configuration outside the repository:

```json
{
  "work": "/private/daemon-benchmark",
  "name": "aqbench-example-daemons",
  "network": "your-panel-benchmark_default",
  "mantaCheckout": "/sources/manta",
  "wingsCheckout": "/sources/wings",
  "panelRuntime": "/private/panel-runtime-benchmark",
  "assets": "/private/game-assets"
}
```

The asset directory contains `server.jar`, `paper-metadata.json` from the Paper
Fill v3 build API, `bedrock-current.zip` and `bedrock-links.json` from Microsoft's
official Bedrock download-links API. The November 20 run pins Paper 26.3 build
257 and Bedrock 1.26.66.1. The Paper publisher checksum is verified; all assets
and runtime images are hashed/pinned before measurement. Download the binaries
from their publishers and comply with their terms; they are not redistributed.
The Bedrock fixtures explicitly use `transport=raknet` so the UDP query workload
is consistent; the current publisher download otherwise defaults to NetherNet.
The published final run uses previously initialized worlds, and excludes its
first cached start from the warm-start medians. Normal startup configuration
sync and registry digest checks are included; image layers are already cached.

```bash
node scripts/daemon-suite/setup.mjs /private/config.json build
node scripts/daemon-suite/setup.mjs /private/config.json engine
node scripts/daemon-suite/setup.mjs /private/config.json assets
node scripts/daemon-suite/setup.mjs /private/config.json provision
node scripts/daemon-suite/run.mjs /private/config.json /private/results
```

The `build` phase uses Go 1.27.4, four CPU cores, 6 GiB RAM, CGO disabled and
matching trimpath/stripping flags. Compiler and module caches are outside timed
workloads. The `engine` phase creates a 16-core, 12 GiB private engine and builds
one common Alpine runtime containing the two binaries and load generator.
`assets` pulls and pins both game images, caches Paper dependencies and extracts
Bedrock. `provision` places matching files/properties into four dedicated server
directories and starts both daemons with two cores, 1 GiB and GOMAXPROCS=2.

Manta talks to Aquadactyl; unchanged Wings talks to its native Pterodactyl v1
backend because its initial page-zero request is rejected by Aquadactyl. Native
Panel bootstrap and SFTP authentication are excluded from transfer timers.
The API/file tests call daemons directly. The game fixtures are explicitly named
`Benchmark ...`; the runner rejects a manifest with unexpected nodes or servers.

The runner performs lifecycle, API/files/events, idle/command-load resources,
and automatic-stat stream checks sequentially. API measurements use three
alternating five-second windows per endpoint/concurrency, with errors recorded.
No security audit, Go coverage run or production capacity test is implied.
The workload derives from Manta's `benchmarks/runner` at v1.2-beta, with longer
API windows, native executable paths and retained resource sample arrays.
The upstream MIT copyright and permission notice is retained in `LICENSE`.

`private-state.json`, `manifest.json`, node configurations and database credentials
must remain private. Only the credential-free completed reports and reviewed
source/provenance files are eligible for publication. Run
`node scripts/verify-comparison-data.mjs` after publishing the dated artifacts.

For cleanup, remove only the named benchmark engine and its matching engine/data
volumes, then the disposable panel Compose project. Do not prune the global
Docker installation or remove unrelated containers/volumes.
