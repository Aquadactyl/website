import { useEffect } from "react";
import "./documentation.css";
import { Link, NavLink } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  Layers,
  LifeBuoy,
  RefreshCw,
  Terminal,
} from "lucide-react";
import Github from "./components/GithubIcon";
import CodeBlock from "./components/CodeBlock";
import {
  BLUEPRINT_COMMAND,
  BRANCH,
  COMMUNITY,
  INSTALL_COMMAND,
  REPOSITORY,
  UPDATE_COMMAND,
} from "./config";

type DocPage = "installation" | "updating" | "blueprint";
const titles = {
  installation: "Install Aquadactyl",
  updating: "Update your panel",
  blueprint: "Blueprint integration",
};
const outlines = {
  installation: [
    ["requirements", "Requirements"],
    ["source", "Get the source"],
    ["environment", "Configure & install"],
    ["admin", "Create an administrator"],
    ["web-server", "Web server & TLS"],
    ["queue", "Queue & scheduler"],
    ["wings", "Configure Wings"],
  ],
  updating: [
    ["before-updating", "Before you update"],
    ["run-update", "Run the updater"],
    ["update-process", "What the updater does"],
    ["recovery", "If an update fails"],
  ],
  blueprint: [
    ["included", "What’s included"],
    ["extensions", "Install an extension"],
    ["maintenance", "Extension maintenance"],
    ["framework-updates", "Framework updates"],
  ],
};

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="doc-note">
      <Info size={18} />
      <div>{children}</div>
    </div>
  );
}

function Installation() {
  return (
    <>
      <p className="doc-intro">
        Aquadactyl includes its own installation script and a bundled copy of
        Blueprint. Prepare your Linux host, configure the panel, then run the
        installer.
      </p>
      <Note>
        These instructions follow the deployment tools included with Aquadactyl.
        The scripts manage a prepared host; install system packages and
        configure TLS separately.
      </Note>
      <section id="requirements">
        <h2>
          <span>01</span>Prepare your host
        </h2>
        <p>
          You’ll need a Linux host with systemd, an HTTPS domain for the panel,
          and the following dependencies:
        </p>
        <div className="requirements-table">
          <div>
            <strong>PHP</strong>
            <span>8.5 with PHP-FPM (8.4 also supported)</span>
          </div>
          <div>
            <strong>Composer</strong>
            <span>Version 2</span>
          </div>
          <div>
            <strong>Node.js</strong>
            <span>22.13 or later</span>
          </div>
          <div>
            <strong>pnpm</strong>
            <span>12.10.1</span>
          </div>
          <div>
            <strong>Web server</strong>
            <span>Nginx</span>
          </div>
          <div>
            <strong>Database</strong>
            <span>MariaDB or MySQL</span>
          </div>
          <div>
            <strong>Cache & queues</strong>
            <span>Redis</span>
          </div>
        </div>
        <p>
          Required PHP extensions: <code>bcmath</code>, <code>curl</code>,{" "}
          <code>gd</code>, <code>mbstring</code>, <code>PDO MySQL</code>,{" "}
          <code>posix</code>, <code>XML</code> and <code>zip</code>.
        </p>
        <p>
          Command-line utilities: bash, curl, git, zip, unzip, rsync, flock,
          runuser and mariadb-dump (or mysqldump). On Debian and Ubuntu, install
          the relevant packages including <code>rsync</code>,{" "}
          <code>util-linux</code> and <code>mariadb-client</code>.
        </p>
        <CodeBlock
          title="Pin the package manager"
          code="sudo npm install --global pnpm@12.10.1"
        />
        <p>
          Keep your database and Redis on localhost or a private network. Use
          the same PHP version for the CLI, FPM and queue service.
        </p>
      </section>
      <section id="source">
        <h2>
          <span>02</span>Get the panel source
        </h2>
        <p>
          Extract a reviewed Aquadactyl release or clone the source into{" "}
          <code>/var/www/aquadactyl</code>. The destination must be empty for a
          fresh checkout.
        </p>
        <CodeBlock
          title="Source checkout"
          code={`sudo git clone --branch ${BRANCH} ${REPOSITORY}.git /var/www/aquadactyl\ncd /var/www/aquadactyl`}
        />
        <p>
          The supplied Nginx and queue templates use this path for new installs.
          The installer builds frontend assets from the committed dependency
          lockfile. Existing installations can keep their current directory,
          including <code>/var/www/pterodactyl</code>; adjust the templates to
          that directory and retain the existing queue worker and scheduler.
        </p>
      </section>
      <section id="environment">
        <h2>
          <span>03</span>Configure and install
        </h2>
        <p>
          Copy the environment template and set your HTTPS <code>APP_URL</code>,
          database credentials, Redis connection and mail settings. Save the
          file before running the installer.
        </p>
        <p>
          New installs default to <code>APP_NAME=Aquadactyl</code>,{" "}
          <code>DB_USERNAME=aquadactyl</code> and{" "}
          <code>MAIL_FROM_NAME="Aquadactyl Panel"</code>. Create the database
          account or supply your own credentials; the installer does not create
          database users.
        </p>
        <CodeBlock title="Install the panel" code={INSTALL_COMMAND} />
        <p>
          The installer creates missing application keys, runs migrations,
          initializes bundled Blueprint, builds the frontend and refreshes
          caches.
        </p>
        <Note>
          Preserve your <code>APP_KEY</code> and <code>HASHIDS_SALT</code>{" "}
          across updates and backups. The application key encrypts stored
          credentials. For local HTTP development, explicitly set{" "}
          <code>SESSION_SECURE_COOKIE=false</code>.
        </Note>
      </section>
      <section id="admin">
        <h2>
          <span>04</span>Create your administrator
        </h2>
        <p>
          For a <strong>new, empty panel</strong>, add the default nests and
          create an administrator. Run the general database seeder only as part
          of a fresh installation.
        </p>
        <CodeBlock
          title="First administrator"
          code={`cd /var/www/aquadactyl\nsudo -u www-data php artisan db:seed --class=DatabaseSeeder --force\nsudo -u www-data php artisan p:user:make`}
        />
      </section>
      <section id="web-server">
        <h2>
          <span>05</span>Configure Nginx and TLS
        </h2>
        <p>
          Edit <code>deploy/nginx/panel.conf</code> for your domain, TLS
          certificate paths and PHP-FPM socket, then install it as your Nginx
          site. Serve only the panel’s <code>public/</code> directory.
        </p>
        <p>
          Install <code>deploy/php/99-panel.ini</code> into your FPM{" "}
          <code>conf.d</code> directory and reload the matching FPM service.
          Validate the Nginx configuration before reloading it.
        </p>
        <CodeBlock title="Validate Nginx" code="sudo nginx -t" />
        <p>
          The templates include compression, cache rules for hashed assets,
          restrictions on hidden files and PHP execution through{" "}
          <code>index.php</code>. Only <code>storage/</code> and{" "}
          <code>bootstrap/cache/</code> should be writable by the web user.
        </p>
        <Note>
          The scripts default to <code>www-data</code> and{" "}
          <code>php8.5-fpm</code>. For PHP 8.4, set{" "}
          <code>PHP_FPM_SERVICE=php8.4-fpm</code> and use the matching Nginx
          socket. Do not use <code>777</code> permissions.
        </Note>
      </section>
      <section id="queue">
        <h2>
          <span>06</span>Start the queue and scheduler
        </h2>
        <p>
          Review the paths and PHP version in the supplied service file, then
          install and enable it:
        </p>
        <CodeBlock
          title="Queue service"
          code={`cd /var/www/aquadactyl\nsudo cp deploy/systemd/pteroq.service /etc/systemd/system/pteroq.service\nsudo systemctl daemon-reload\nsudo systemctl enable --now pteroq.service`}
        />
        <p>
          Add this line to <code>/etc/cron.d/aquadactyl</code>:
        </p>
        <CodeBlock
          title="Scheduler"
          code="* * * * * www-data cd /var/www/aquadactyl && /usr/bin/php artisan schedule:run >> /dev/null 2>&1"
        />
      </section>
      <section id="wings">
        <h2>
          <span>07</span>Connect your game server nodes
        </h2>
        <p>
          The panel manages your servers. Wings runs the games on separate nodes
          using Docker containers. Install and configure Wings separately, then
          register your nodes in the panel.
        </p>
        <a
          className="text-link"
          href="https://pterodactyl.io/wings/1.0/installing.html"
          target="_blank"
          rel="noreferrer"
        >
          Read the upstream Wings guide <ArrowUpRight size={15} />
        </a>
      </section>
    </>
  );
}

function Updating() {
  return (
    <>
      <p className="doc-intro">
        Update Aquadactyl and its bundled Blueprint framework together, using
        the managed updater and a reviewed release of this fork.
      </p>
      <section id="before-updating">
        <h2>Before you update</h2>
        <p>
          Choose an explicit, published Aquadactyl release tag. Review changes
          and check extension compatibility before updating a production panel.
        </p>
        <ul className="doc-checklist">
          <li>
            <Check size={15} />
            Keep every installed extension’s original{" "}
            <code>identifier.blueprint</code> package in the panel root.
          </li>
          <li>
            <Check size={15} />
            Back up your panel off-host as well as locally.
          </li>
          <li>
            <Check size={15} />
            Preserve your environment, application key and Hashids salt.
          </li>
          <li>
            <Check size={15} />
            Check custom scripts and extensions in staging first.
          </li>
        </ul>
        <Note>
          A missing extension package stops the update before maintenance or
          file changes. Extension scripts run again when their hooks are
          reapplied. Keep the existing panel directory, database credentials,
          application key and Hashids salt. The updater preserves your
          environment and extension data.
        </Note>
      </section>
      <section id="run-update">
        <h2>Run the managed updater</h2>
        <p>
          Replace <code>vRELEASE_TAG</code> with a reviewed, published tag from
          the Aquadactyl repository. This is a placeholder, not a released
          version.
        </p>
        <CodeBlock title="Update Aquadactyl" code={UPDATE_COMMAND} />
        <p>
          The release archive must include <code>panel.tar.gz</code> and{" "}
          <code>SHA256SUMS</code>. For an archive you’ve already downloaded,
          provide the verified SHA256:
        </p>
        <CodeBlock
          title="Local archive"
          code="sudo bash scripts/panel-update.sh --archive /tmp/panel.tar.gz YOUR_64_CHARACTER_SHA256"
        />
        <Note>
          <code>php artisan p:upgrade</code> displays the managed update
          instructions and exits without changing the installation. Use the
          managed script above to update the panel and bundled Blueprint
          together.
        </Note>
      </section>
      <section id="update-process">
        <h2>What happens during an update</h2>
        <ol className="doc-numbered-list">
          <li>
            Verify the archive checksum and validate archive paths and links.
          </li>
          <li>Enable maintenance mode and pause the queue.</li>
          <li>
            Create database and filesystem backups in{" "}
            <code>/var/backups/aquadactyl</code>.
          </li>
          <li>Preserve your environment, uploads and extension data.</li>
          <li>
            Install locked dependencies, run migrations and restore extension
            hooks.
          </li>
          <li>
            Rebuild frontend assets and application caches, reload FPM and
            restart the queue.
          </li>
          <li>Bring the panel online.</li>
        </ol>
        <p>
          Override the backup location with <code>BACKUP_DIR</code>. To retain
          an older default location, set{" "}
          <code>BACKUP_DIR=/var/backups/pterodactyl</code> when running the
          updater.
        </p>
        <p>
          Keep copies off-host and choose a retention policy suitable for your
          installation.
        </p>
      </section>
      <section id="recovery">
        <h2>If an update fails</h2>
        <p>
          The updater leaves maintenance enabled and the queue paused when
          applicable, and prints the backup directory. It does not automatically
          reverse database migrations.
        </p>
        <p>
          For a transient failure, resolve the problem and inspect the panel
          before bringing it online. To recover the previous version, stop FPM
          and the queue, move the failed panel directory aside, recreate the
          original directory and extract the filesystem backup there.
        </p>
        <p>
          Restore <code>database.sql</code> using a database administrator,
          reinstall dependencies using the restored version’s package manager,
          and run the restored version’s cache commands. Reload FPM, start the
          queue, then run <code>php artisan up</code>.
        </p>
        <Note>
          The filesystem snapshot includes <code>.env</code>, vendor
          dependencies and Blueprint extension data. Coordinate maintenance
          across all panel instances if they share a database.
        </Note>
      </section>
    </>
  );
}

function Blueprint() {
  return (
    <>
      <p className="doc-intro">
        Blueprint beta-2026-08 is bundled with Aquadactyl. The panel installer
        initializes the framework so you can start extending your panel without
        a separate framework download.
      </p>
      <section id="included">
        <h2>What’s included</h2>
        <p>
          Aquadactyl integrates Blueprint’s backend, extension routes, admin
          pages, client hooks, components, migrations and command-line tools.
          Installation initializes public asset links, settings and framework
          placeholders.
        </p>
        <p>
          The bundled framework comes from the reviewed upstream beta-2026-08
          release. Its provenance and license are recorded in the panel’s{" "}
          <code>deploy/</code> directory.
        </p>
        <p>
          Blueprint code and branding artwork have separate license terms.
          Review the panel’s{" "}
          <a
            href={`${REPOSITORY}/blob/${BRANCH}/docs/BRANDING.md#names-and-artwork`}
          >
            artwork licensing notes
          </a>{" "}
          before redistributing bundled artwork.
        </p>
      </section>
      <section id="extensions">
        <h2>Install an extension</h2>
        <p>
          Place the extension’s <code>myextension.blueprint</code> package in{" "}
          <code>/var/www/aquadactyl</code>. Replace <code>myextension</code>{" "}
          below with its identifier:
        </p>
        <CodeBlock title="Blueprint CLI" code={BLUEPRINT_COMMAND} />
        <p>
          Themes and extensions are installed separately. Aquadactyl includes
          the framework, not every extension in the ecosystem.
        </p>
        <Note>
          Extensions execute PHP, frontend and shell code as part of your panel.
          Use trusted publishers and check compatibility before updating
          production.
        </Note>
      </section>
      <section id="maintenance">
        <h2>Keep your extension packages</h2>
        <p>
          Retain the original <code>identifier.blueprint</code> packages in the
          panel root. The managed updater uses them to rebuild hooks against the
          new panel source.
        </p>
        <p>
          Aquadactyl uses pnpm 12.10.1 for framework installation, extension
          rebuilds and development. Update extension scripts that still call
          Yarn to use pnpm.
        </p>
        <p>
          Extension installation can change filesystem ownership. Reapply the
          deployment permissions after extension maintenance:
        </p>
        <CodeBlock
          title="Restore deployment permissions"
          code={`cd /var/www/aquadactyl\nsudo bash -c 'source scripts/deploy/common.sh; preflight; finish_deployment'`}
        />
      </section>
      <section id="framework-updates">
        <h2>Update the framework with the panel</h2>
        <p>
          The stock <code>blueprint -upgrade</code> command is disabled in
          Aquadactyl because it replaces core files and dependency manifests.
          Use the managed panel updater to keep the framework and panel changes
          compatible.
        </p>
        <Link className="text-link" to="/docs/updating">
          Read the update guide <ArrowRight size={15} />
        </Link>
      </section>
    </>
  );
}

export default function Documentation({ page }: { page: DocPage }) {
  useEffect(() => {
    document.title = `${titles[page]} — Aquadactyl documentation`;
  }, [page]);
  return (
    <main className="docs-layout container">
      <aside className="docs-sidebar">
        <Link className="docs-back" to="/">
          <ArrowLeft size={13} />
          Back to the project
        </Link>
        <p className="eyebrow">Documentation</p>
        <nav aria-label="Documentation">
          <NavLink end to="/docs">
            <Terminal size={16} />
            Installation
          </NavLink>
          <NavLink to="/docs/updating">
            <RefreshCw size={16} />
            Updating
          </NavLink>
          <NavLink to="/docs/blueprint">
            <Layers size={16} />
            Blueprint
          </NavLink>
        </nav>
        <div className="docs-sidebar-help">
          <LifeBuoy size={21} />
          <h3>Need help?</h3>
          <p>Ask the community on Discord.</p>
          <a href={COMMUNITY} target="_blank" rel="noreferrer">
            Join Discord <ArrowUpRight size={13} />
          </a>
        </div>
      </aside>
      <article className="docs-article">
        <div className="docs-breadcrumb">
          <BookOpen size={13} />
          Docs
          <ChevronRight size={12} />
          {page === "installation"
            ? "Installation"
            : page === "updating"
              ? "Updating"
              : "Blueprint"}
        </div>
        <h1>{titles[page]}</h1>
        <details className="docs-mobile-toc" key={page}>
          <summary>
            On this page <ChevronDown size={16} />
          </summary>
          <nav aria-label="Guide sections">
            {outlines[page].map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(event) =>
                  event.currentTarget
                    .closest("details")
                    ?.removeAttribute("open")
                }
              >
                {label}
              </a>
            ))}
          </nav>
        </details>
        {page === "installation" ? (
          <Installation />
        ) : page === "updating" ? (
          <Updating />
        ) : (
          <Blueprint />
        )}
        <div className="docs-end">
          <p>
            Based on the Aquadactyl panel’s deployment and Blueprint guides.
          </p>
          <a
            href={`${REPOSITORY}/tree/${BRANCH}/docs`}
            target="_blank"
            rel="noreferrer"
          >
            <Github size={14} />
            View panel documentation <ArrowUpRight size={13} />
          </a>
        </div>
        <div className="docs-next">
          <Link
            to={
              page === "installation"
                ? "/docs/blueprint"
                : page === "blueprint"
                  ? "/docs/updating"
                  : "/docs"
            }
          >
            <span>Next guide</span>
            <strong>
              {page === "installation"
                ? "Blueprint integration"
                : page === "blueprint"
                  ? "Update your panel"
                  : "Install Aquadactyl"}{" "}
              <ArrowRight size={18} />
            </strong>
          </Link>
        </div>
      </article>
      <aside className="docs-toc">
        <p>On this page</p>
        <nav aria-label="On this page">
          {outlines[page].map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
        <a
          className="docs-source"
          href={REPOSITORY}
          target="_blank"
          rel="noreferrer"
        >
          <Github size={14} />
          Source code <ArrowUpRight size={12} />
        </a>
      </aside>
    </main>
  );
}
