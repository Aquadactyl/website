export const panelReview = {
  reviewedOn: "18 October 2026",
  aquadactyl: "f2680179b5ebdf508e45bfd7006d5954b95b0df7",
  pterodactyl: "e98678c5a1d07a74036660a459d87a4eb7c105c1",
  pterodactylRelease: "v1.15.1",
};

export const featureCategories = [
  "Everyday use",
  "Accounts & privacy",
  "Extensions",
  "Operations",
] as const;
export type FeatureCategory = (typeof featureCategories)[number];

export interface PanelFeature {
  id: string;
  icon: string;
  category: FeatureCategory;
  title: string;
  text: string;
  upstream: string;
  availability: "Included" | "Configurable" | "Off by default";
  href: string;
  source: string;
}

// The cards and comparison table share this catalogue so their claims stay aligned.
export const panelFeatures: PanelFeature[] = [
  {
    id: "server-folders",
    icon: "Folder",
    category: "Everyday use",
    title: "Personal server folders",
    text: "Organise owned and shared servers into personal folders, saved across devices. Admins can disable folders without deleting saved organisation.",
    upstream:
      "A flat server list with ownership filters; no personal server folders.",
    availability: "Configurable",
    href: "/docs/panel/features#server-folders",
    source: "/benchmarks/panel-v2-comparison-aquadactyl.patch",
  },
  {
    id: "owner-search",
    icon: "Search",
    category: "Operations",
    title: "Search servers by owner",
    text: "Administrators can search Other servers by owner username, email or full name alongside server names and addresses. Existing access permissions apply.",
    upstream:
      "Client server search matches server details; owner lookup is separate in the admin area.",
    availability: "Included",
    href: "/docs/panel/features#owner-search",
    source: "/benchmarks/panel-v2-comparison-aquadactyl.patch",
  },
  {
    id: "file-previews",
    icon: "Image",
    category: "Everyday use",
    title: "Larger files & image previews",
    text: "Edit text files up to the configurable 32 MiB default and preview supported images directly from the file list, with existing file permissions.",
    upstream:
      "A smaller default editor limit; images are downloaded rather than previewed within the file list.",
    availability: "Included",
    href: "/docs/panel/features#file-access",
    source: "resources/scripts/lib/filePreview.ts",
  },
  {
    id: "browser-uploads",
    icon: "Upload",
    category: "Everyday use",
    title: "Larger browser uploads",
    text: "New nodes default to a configurable 2,048 MiB upload limit, with clearer progress and error handling. Existing node, Wings and proxy limits still apply.",
    upstream:
      "Browser uploads are supported, with a 100 MiB default node limit in the reviewed release.",
    availability: "Configurable",
    href: "/docs/panel/features#file-access",
    source:
      "database/migrations/2026_10_14_000000_increase_default_node_upload_limit.php",
  },
  {
    id: "appearance",
    icon: "Palette",
    category: "Everyday use",
    title: "Appearance & branding",
    text: "Charcoal client and admin styling, your logo and site name, a primary colour, login layouts and background effects with desktop/mobile previews.",
    upstream:
      "Panel naming and standard styling; custom themes, branding and login layouts need additional changes.",
    availability: "Configurable",
    href: "/docs/panel/features#appearance",
    source: "docs/THEME.md",
  },
  {
    id: "egg-library",
    icon: "BookOpen",
    category: "Everyday use",
    title: "Integrated Egg Library",
    text: "Search eggs.download, preview an egg's settings and import into an existing or new nest from the admin area.",
    upstream: "Import an egg JSON file downloaded separately into a nest.",
    availability: "Included",
    href: "/docs/panel/features#egg-library",
    source: "docs/EGG-LIBRARY.md",
  },
  {
    id: "schedules",
    icon: "CalendarClock",
    category: "Everyday use",
    title: "Simpler schedules",
    text: "Daily, weekly, monthly and interval presets, readable task delays and restart, backup or command steps. Advanced cron stays available.",
    upstream:
      "Cron field editor with scheduled command, power and backup tasks.",
    availability: "Included",
    href: "/docs/panel/features#schedules",
    source: "docs/SCHEDULES.md",
  },
  {
    id: "player-counts",
    icon: "Users",
    category: "Everyday use",
    title: "Live player counts",
    text: "Game queries show player counts for supported eggs, with configurable game/query ports and an Unavailable state for failed queries.",
    upstream:
      "Server cards show resource usage and server state; no bundled game-query player counts.",
    availability: "Configurable",
    href: "/docs/panel/features#server-overview",
    source: "config/game-query.php",
  },
  {
    id: "server-overview",
    icon: "Gauge",
    category: "Everyday use",
    title: "Server & console shortcuts",
    text: "Node country flags, permission-aware Files and power shortcuts on server cards, full UUID copying and graphs that follow your primary colour.",
    upstream:
      "Server cards, console controls and resource graphs; power actions are available on the server page.",
    availability: "Configurable",
    href: "/docs/panel/features#server-overview",
    source: "resources/scripts/components/dashboard/ServerRow.tsx",
  },
  {
    id: "file-trash",
    icon: "Trash2",
    category: "Everyday use",
    title: "Recover deleted files",
    text: "Per-server trash for files and folders, restoration and permanent deletion, with 1–365 day retention. Trash still counts towards the server's disk limit.",
    upstream:
      "File deletion is permanent; recovering a deleted file requires another copy or backup.",
    availability: "Off by default",
    href: "/docs/panel/features#file-trash",
    source: "app/Services/Files/FileTrashService.php",
  },
  {
    id: "console-log-sharing",
    icon: "Clipboard",
    category: "Everyday use",
    title: "Share console logs",
    text: "Upload a bounded console tail with credential redaction and receive a copyable link that expires after 24 hours. Review the paste before sharing.",
    upstream:
      "Console output is available in the panel; no bundled console-to-paste sharing control.",
    availability: "Off by default",
    href: "/docs/panel/features#console-log-sharing",
    source:
      "app/Http/Controllers/Api/Client/Servers/ConsoleLogShareController.php",
  },
  {
    id: "activity-filters",
    icon: "ListFilter",
    category: "Everyday use",
    title: "Detailed activity filters",
    text: "Filter account and server activity by event/category, time range, date, source and IP, and switch between newest and oldest entries.",
    upstream:
      "Account and server activity logs with event/IP filtering; fewer filter controls in the default UI.",
    availability: "Included",
    href: "/docs/panel/features#activity",
    source:
      "resources/scripts/components/elements/activity/ActivityLogFilters.tsx",
  },
  {
    id: "searchable-controls",
    icon: "Search",
    category: "Everyday use",
    title: "Searchable client controls",
    text: "Shared dark select controls support searching options, keyboard navigation and grouped choices while retaining normal form behavior.",
    upstream:
      "Native select controls on client forms; admin forms already use Select2.",
    availability: "Included",
    href: "/docs/panel/features#controls",
    source: "resources/scripts/components/elements/Select.tsx",
  },
  {
    id: "passkeys",
    icon: "KeyRound",
    category: "Accounts & privacy",
    title: "Passkey sign-in",
    text: "Users and administrators can register passkeys on a secure origin. Existing account permissions and the two-factor checkpoint still apply.",
    upstream:
      "Password sign-in and TOTP two-factor authentication; no bundled passkey registration flow.",
    availability: "Configurable",
    href: "/docs/panel/features#account-security",
    source: "docs/ACCOUNT-SECURITY.md",
  },
  {
    id: "connected-accounts",
    icon: "Link2",
    category: "Accounts & privacy",
    title: "Connected accounts",
    text: "Link Discord, GitHub, Google or OpenID Connect to an existing account. Administrators choose the available providers.",
    upstream:
      "No bundled provider-linking/sign-in interface for these four providers.",
    availability: "Configurable",
    href: "/docs/panel/features#account-security",
    source: "docs/ACCOUNT-SECURITY.md",
  },
  {
    id: "languages",
    icon: "Languages",
    category: "Accounts & privacy",
    title: "Languages per account",
    text: "English, French and German across client and admin areas, per-user choices, browser-language detection and installable JSON language packs.",
    upstream:
      "Translation infrastructure with the English catalogue in the reviewed release; no equivalent bundled per-account language selector.",
    availability: "Included",
    href: "/docs/panel/features#languages",
    source: "docs/TRANSLATIONS.md",
  },
  {
    id: "avatars",
    icon: "UserRound",
    category: "Accounts & privacy",
    title: "Profile pictures & moderation",
    text: "Users can upload profile pictures. Administrators can disable uploads or remove an individual picture, restoring the default avatar.",
    upstream:
      "Generated/default avatars; no bundled profile-picture upload and moderation workflow.",
    availability: "Configurable",
    href: "/docs/panel/features#profile-pictures",
    source: "docs/APPEARANCE-AND-MAIL.md",
  },
  {
    id: "privacy",
    icon: "EyeOff",
    category: "Accounts & privacy",
    title: "Sensitive-data blur",
    text: "Account preferences blur marked emails, IP addresses, passwords and access keys, with hover, focus or tap to reveal. Administrators control availability.",
    upstream:
      "Individual masked credential fields and access controls; no equivalent panel-wide preference for marked sensitive values.",
    availability: "Configurable",
    href: "/docs/panel/features#privacy",
    source:
      "resources/scripts/components/dashboard/forms/PrivacySettingsForm.tsx",
  },
  {
    id: "registration",
    icon: "UserPlus",
    category: "Accounts & privacy",
    title: "Optional self-registration",
    text: "Administrators can enable a registration page for new user accounts. Registration uses the configured captcha flow and is disabled initially.",
    upstream:
      "Administrators create users through the panel or Application API; no default public registration page.",
    availability: "Off by default",
    href: "/docs/panel/features#registration",
    source: "app/Http/Requests/Auth/RegisterRequest.php",
  },
  {
    id: "blueprint",
    icon: "Puzzle",
    category: "Extensions",
    title: "Blueprint built in",
    text: "Blueprint beta-2026-08 ships with the CLI, admin pages, frontend hooks and extension routes. The installer initializes the framework.",
    upstream:
      "Blueprint is a separate framework installation; extensions and themes are installed separately.",
    availability: "Included",
    href: "/docs/panel/features#blueprint",
    source: "docs/BLUEPRINT.md",
  },
  {
    id: "legacy-addons",
    icon: "Blocks",
    category: "Extensions",
    title: "Legacy addon adapters",
    text: "Compatibility API v1 adapts common legacy styling, stores, routing, forms and icons. Run blueprint -check before installing; runtime review is still required.",
    upstream:
      "Original addon interfaces depend on the installed panel/Blueprint version; no Aquadactyl compatibility adapter layer.",
    availability: "Included",
    href: "/docs/panel/features#legacy-addons",
    source: "docs/BLUEPRINT-COMPATIBILITY.md",
  },
  {
    id: "addon-libraries",
    icon: "Code2",
    category: "Extensions",
    title: "Modern shared addon libraries",
    text: "React 19, TanStack Query, Zustand, Base UI, React Hook Form, Zod, Lucide, date-fns, es-toolkit, Motion and uPlot are available to extension developers.",
    upstream:
      "A different shared runtime: React 16, Easy Peasy, SWR, Tailwind 3, Chart.js and existing addon libraries.",
    availability: "Included",
    href: "/docs/blueprint/development",
    source: "package.json",
  },
  {
    id: "mail",
    icon: "Mail",
    category: "Operations",
    title: "Mail provider controls",
    text: "Configure SMTP, Mailgun, Postmark or Amazon SES in the admin UI, with provider-specific fields, encrypted saved credentials and a test email action.",
    upstream:
      "SMTP admin settings; Laravel mail transports are also present and can be configured through the environment.",
    availability: "Configurable",
    href: "/docs/panel/features#mail",
    source: "docs/APPEARANCE-AND-MAIL.md",
  },
  {
    id: "managed-updates",
    icon: "RefreshCw",
    category: "Operations",
    title: "Managed installation & updates",
    text: "Install/build scripts and a release-checking updater apply migrations, refresh caches and back up database and panel files while preserving configuration and extension data.",
    upstream:
      "Documented installation and update steps; operators arrange release checks and backups.",
    availability: "Included",
    href: "/docs/panel/features#managed-updates",
    source: "docs/DEPLOYMENT.md",
  },
  {
    id: "deployment",
    icon: "ShieldCheck",
    category: "Operations",
    title: "Prepared deployment defaults",
    text: "Supplied deployment profiles bring together Redis, OPcache, Laravel caches, compressed/cached assets and restricted filesystem permissions.",
    upstream:
      "Supports Redis, Laravel caching, web-server tuning and secure deployment; configuration depends on the operator and deployment method.",
    availability: "Included",
    href: "/docs/panel/features#deployment",
    source: "docs/DEPLOYMENT.md",
  },
  {
    id: "local-stack",
    icon: "Container",
    category: "Operations",
    title: "Integrated local test stack",
    text: "Docker Compose initializes the panel, database, Redis, Blueprint, a local administrator and a connected Wings node for development.",
    upstream:
      "Panel Docker image is available; a matching database, Redis and connected Wings test setup must be configured.",
    availability: "Included",
    href: "/docs/panel/features#local-stack",
    source: "BUILDING.md",
  },
  {
    id: "telemetry",
    icon: "Radio",
    category: "Operations",
    title: "Telemetry controls",
    text: "Aquadactyl and Blueprint telemetry default to off on new installs. Upstream Pterodactyl telemetry is removed; administrators can explicitly opt in to Aquadactyl reporting.",
    upstream:
      "Pterodactyl telemetry is enabled by default in the reviewed configuration and can be disabled by environment setting.",
    availability: "Off by default",
    href: "/docs/panel/features#telemetry",
    source: "config/aquadactyl.php",
  },
  {
    id: "diagnostics",
    icon: "Bug",
    category: "Operations",
    title: "Previewable debug sharing",
    text: "Preview a redacted panel-log tail with p:debug --dry-run, then explicitly upload a temporary paste. Warning-level daily logs retain seven days by default.",
    upstream:
      "Panel logs and p:debug diagnostics are available; the redacted preview and paste workflow differs.",
    availability: "Included",
    href: "/docs/panel/features#diagnostics",
    source: "app/Console/Commands/DebugCommand.php",
  },
];

export function panelSource(project: "aquadactyl" | "pterodactyl", file = "") {
  if (file.startsWith("/")) return file;
  const repository =
    project === "aquadactyl" ? "Aquadactyl/aquadactyl" : "pterodactyl/panel";
  const revision = panelReview[project];
  return `https://github.com/${repository}/${file ? "blob" : "tree"}/${revision}/${file}`;
}
