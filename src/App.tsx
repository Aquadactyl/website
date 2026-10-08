import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Box,
  ChevronDown,
  Code2,
  ExternalLink,
  Menu,
  MessageCircle,
  Puzzle,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import PanelPreview from "./components/PanelPreview";
import Github from "./components/GithubIcon";
import CodeBlock from "./components/CodeBlock";
import Documentation from "./Documentation";
import {
  BLUEPRINT_COMMAND,
  BRANCH,
  COMMUNITY,
  EUPHORIA,
  INSTALL_COMMAND,
  REPOSITORY,
  UPDATE_COMMAND,
} from "./config";

function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    function close(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
        document.getElementById("navigation-toggle")?.focus();
      }
    }
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 801px)");
    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <header className="site-header">
      <div className="header-inner container">
        <Link to="/" className="brand" aria-label="Aquadactyl home">
          <img src="/brand/euphoria.png" alt="Euphoria Development logo" />
          <span>Euphoria Development</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <NavLink end to="/">
            <Server size={14} />
            Aquadactyl
          </NavLink>
          <Link to="/#blueprint">
            <Puzzle size={14} />
            Blueprint
          </Link>
          <NavLink to="/docs">
            <BookOpen size={14} />
            Docs
          </NavLink>
          <a href={COMMUNITY} target="_blank" rel="noreferrer">
            <MessageCircle size={14} />
            Discord
          </a>
          <a href={REPOSITORY} target="_blank" rel="noreferrer">
            <Github size={14} />
            GitHub
          </a>
        </nav>
        <button
          id="navigation-toggle"
          className="menu-toggle"
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-nav container"
          aria-label="Mobile navigation"
        >
          <Link to="/">Aquadactyl</Link>
          <Link to="/#panel-preview">Panel preview</Link>
          <Link to="/#blueprint">Blueprint</Link>
          <Link to="/docs">Documentation</Link>
          <a
            href={COMMUNITY}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            Discord <ArrowUpRight size={14} />
          </a>
          <a
            href={REPOSITORY}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            GitHub <ArrowUpRight size={14} />
          </a>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner container">
        <div className="footer-main">
          <a
            href={EUPHORIA}
            target="_blank"
            rel="noreferrer"
            className="footer-brand"
          >
            <img src="/brand/euphoria.png" alt="" />
            Euphoria Development
          </a>
          <nav aria-label="Footer navigation">
            <Link to="/docs">Documentation</Link>
            <a href={REPOSITORY} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={COMMUNITY} target="_blank" rel="noreferrer">
              Discord
            </a>
          </nav>
        </div>
        <p>
          © {new Date().getFullYear()} Euphoria Development ·{" "}
          <a
            href={`${REPOSITORY}/blob/${BRANCH}/LICENSE.md`}
            target="_blank"
            rel="noreferrer"
          >
            MIT licensed
          </a>
        </p>
        <p className="fork-credit">
          Aquadactyl is an independent fork of{" "}
          <a href="https://pterodactyl.io" target="_blank" rel="noreferrer">
            Pterodactyl
          </a>
          , with{" "}
          <a href="https://blueprint.zip" target="_blank" rel="noreferrer">
            Blueprint
          </a>{" "}
          included. Credit to their authors and contributors.
        </p>
      </div>
    </footer>
  );
}

const features: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Server,
    title: "Pterodactyl Panel",
    text: "Manage your console, files, backups, schedules and users through the familiar Pterodactyl interface.",
  },
  {
    icon: Puzzle,
    title: "Blueprint included",
    text: "The framework, CLI, admin pages and extension hooks are bundled and initialized during installation.",
  },
  {
    icon: RefreshCw,
    title: "Managed updates",
    text: "Update scripts verify releases and back up your database and panel files before applying changes.",
  },
  {
    icon: Box,
    title: "Docker containers",
    text: "Game servers run on separate Wings nodes, each with its own container and resource limits.",
  },
  {
    icon: ShieldCheck,
    title: "Deployment defaults",
    text: "Redis, OPcache, Nginx templates and restricted filesystem permissions are part of the deployment setup.",
  },
  {
    icon: Code2,
    title: "Open source",
    text: "MIT licensed and self hosted. Read the source, make changes or contribute to the project on GitHub.",
  },
];

const addons = [
  {
    name: "Refresh Theme",
    description: "A dark admin theme for Pterodactyl Panel.",
    repository: "Refresh-Theme",
    type: "Theme",
    image: "/blueprints/refresh-theme.jpeg",
  },
  {
    name: "Resource Manager",
    description: "Browse, manage and upload server images.",
    repository: "Resource-Manager",
    type: "Addon",
    image: "/blueprints/resource-manager.jpeg",
  },
  {
    name: "Laravel Logs",
    description: "View and download Laravel logs from your panel.",
    repository: "Laravel-Logs",
    type: "Addon",
    image: "/blueprints/laravel-logs.jpeg",
  },
];

function Home() {
  const [installTab, setInstallTab] = useState<
    "install" | "update" | "extensions"
  >("install");
  const installContent = {
    install: {
      title: "New installation",
      intro:
        "Prepare a Linux host and place the Aquadactyl source in /var/www/aquadactyl. Configure your environment before running the installer.",
      code: INSTALL_COMMAND,
      note: "Set your HTTPS domain, database, Redis and mail settings in .env. The full guide also covers Nginx, the queue service and Wings.",
      link: "/docs",
    },
    update: {
      title: "Update your panel",
      intro:
        "Use a reviewed Aquadactyl release to update the panel and bundled Blueprint together. The updater backs up your panel first.",
      code: UPDATE_COMMAND,
      note: "Replace vRELEASE_TAG with a published release tag. Keep your original .blueprint extension packages in the panel root.",
      link: "/docs/updating",
    },
    extensions: {
      title: "Install an extension",
      intro:
        "Place your extension package in the panel root, then install it with the bundled Blueprint CLI.",
      code: BLUEPRINT_COMMAND,
      note: "Replace myextension with the package identifier. Extensions are available separately; check compatibility before installing.",
      link: "/docs/blueprint",
    },
  }[installTab];

  return (
    <main>
      <section className="hero">
        <div className="hero-content container">
          <p className="project-owner">
            <Server size={16} />A project by Euphoria Development
          </p>
          <h1>Aquadactyl</h1>
          <p className="hero-description">
            Pterodactyl Panel with Blueprint built in.
            <br />
            An open-source game server panel for your community.
          </p>
          <div className="hero-actions">
            <Link to="/docs" className="button button-accent">
              Install Aquadactyl <ArrowRight size={16} />
            </Link>
            <a
              href={REPOSITORY}
              target="_blank"
              rel="noreferrer"
              className="button button-outline"
            >
              <Github size={16} />
              GitHub
            </a>
          </div>
          <p className="hero-meta">
            Free and open source <span>·</span> Self hosted <span>·</span> MIT
            licensed
          </p>
        </div>
      </section>
      <section
        className="panel-section container"
        aria-labelledby="preview-heading"
      >
        <div className="section-heading">
          <h2 id="preview-heading">
            <Terminal size={23} />
            Panel preview
          </h2>
          <p>Console, files and backups. Try the controls below.</p>
        </div>
        <PanelPreview />
      </section>
      <section
        id="features"
        className="features-section container"
        aria-labelledby="features-heading"
      >
        <div className="section-heading">
          <h2 id="features-heading">
            <Server size={23} />
            What’s included
          </h2>
        </div>
        <div className="features-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="feature">
              <h3>
                <Icon size={19} />
                {title}
              </h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <p className="games-note">
          Use Pterodactyl eggs for Minecraft, Rust, Terraria, Valheim,
          Counter-Strike and other games.
        </p>
      </section>
      <section
        id="blueprint"
        className="blueprint-section"
        aria-labelledby="blueprint-heading"
      >
        <div className="container">
          <div className="section-heading">
            <h2 id="blueprint-heading">
              <Puzzle size={23} />
              Blueprint
            </h2>
            <p>Install themes and addons from the Euphoria ecosystem.</p>
          </div>
          <p className="blueprint-description">
            Aquadactyl includes Blueprint beta-2026-08. Individual extensions
            are installed separately.
          </p>
          <div className="addons-grid">
            {addons.map(({ name, description, repository, type, image }) => (
              <article key={name} className="addon-card">
                <div className="addon-heading">
                  <h3>{name}</h3>
                  <span>{type}</span>
                </div>
                <p>{description}</p>
                <img
                  className="addon-image"
                  src={image}
                  alt={name + " artwork"}
                  width={1920}
                  height={1080}
                  loading="lazy"
                  decoding="async"
                />
                <a
                  href={"https://github.com/EuphoriaTheme/" + repository}
                  target="_blank"
                  rel="noreferrer"
                  className="resource-link"
                >
                  View on GitHub <Github size={14} />
                </a>
              </article>
            ))}
          </div>
          <div className="section-links">
            <a
              href={EUPHORIA + "/#blueprints"}
              target="_blank"
              rel="noreferrer"
            >
              Browse Euphoria blueprints <ExternalLink size={14} />
            </a>
            <Link to="/docs/blueprint">
              Blueprint setup guide <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
      <section
        id="get-started"
        className="getting-started container"
        aria-labelledby="install-heading"
      >
        <div className="section-heading">
          <h2 id="install-heading">
            <Terminal size={23} />
            Installation
          </h2>
          <p>Follow the guide for a new panel, or use the managed updater.</p>
        </div>
        <div className="installation-layout">
          <div className="installation-copy">
            <div
              className="install-tabs"
              role="tablist"
              aria-label="Installation commands"
            >
              {(
                [
                  { value: "install", label: "Install" },
                  { value: "update", label: "Update" },
                  { value: "extensions", label: "Extensions" },
                ] as const
              ).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={installTab === item.value}
                  aria-controls="install-content"
                  id={"install-tab-" + item.value}
                  tabIndex={installTab === item.value ? 0 : -1}
                  onClick={() => setInstallTab(item.value)}
                  onKeyDown={(event) => {
                    const choices = [
                      "install",
                      "update",
                      "extensions",
                    ] as const;
                    if (
                      event.key === "ArrowRight" ||
                      event.key === "ArrowLeft"
                    ) {
                      event.preventDefault();
                      const next =
                        choices[
                          (choices.indexOf(installTab) +
                            (event.key === "ArrowRight" ? 1 : 2)) %
                            3
                        ];
                      setInstallTab(next);
                      document.getElementById("install-tab-" + next)?.focus();
                    }
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div
              id="install-content"
              role="tabpanel"
              aria-labelledby={"install-tab-" + installTab}
            >
              <h3>{installContent.title}</h3>
              <p>{installContent.intro}</p>
              <Link to={installContent.link} className="text-link">
                <BookOpen size={15} />
                Read the full guide <ArrowRight size={14} />
              </Link>
            </div>
            <p className="requirements-line">
              <Server size={15} />
              <span>
                Linux · PHP 8.4 / 8.5 · Node.js 22.13+
                <br />
                Nginx · MariaDB / MySQL · Redis
              </span>
            </p>
          </div>
          <div className="installation-code">
            <CodeBlock
              title={installContent.title}
              code={installContent.code}
            />
            <p className="command-note">{installContent.note}</p>
          </div>
        </div>
      </section>
      <section
        className="faq-section container"
        aria-labelledby="questions-heading"
      >
        <div className="section-heading">
          <h2 id="questions-heading">Common questions</h2>
        </div>
        <div className="faq-list">
          {[
            [
              "Is Aquadactyl an official Pterodactyl release?",
              "No. Aquadactyl is an independent fork maintained by Euphoria Development. It builds on Pterodactyl and bundles Blueprint, with the original credits and licenses retained.",
            ],
            [
              "Do I need to install Blueprint separately?",
              "No. Blueprint beta-2026-08 is bundled in the panel source and initialized by the Aquadactyl installer. Individual themes and extensions are installed separately.",
            ],
            [
              "Does the installer set up Wings?",
              "Wings is configured separately on your game server nodes. Aquadactyl manages the panel; Wings runs the game servers in Docker containers. The installation guide links to the Wings documentation.",
            ],
          ].map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <ChevronDown size={17} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section
        className="community-section"
        aria-labelledby="community-heading"
      >
        <div className="container">
          <div className="section-heading">
            <h2 id="community-heading">
              <MessageCircle size={23} />
              Get involved
            </h2>
            <p>Contribute, get support or see our other projects.</p>
          </div>
          <div className="community-grid">
            <a href={REPOSITORY} target="_blank" rel="noreferrer">
              <Github size={24} />
              <h3>GitHub</h3>
              <p>Read the source, report a bug or contribute.</p>
              <span>
                Open repository <ArrowUpRight size={13} />
              </span>
            </a>
            <a href={COMMUNITY} target="_blank" rel="noreferrer">
              <MessageCircle size={24} />
              <h3>Discord</h3>
              <p>Ask questions and join the community.</p>
              <span>
                Join Discord <ArrowUpRight size={13} />
              </span>
            </a>
            <a href={EUPHORIA} target="_blank" rel="noreferrer">
              <img src="/brand/euphoria.png" alt="" />
              <h3>Euphoria Development</h3>
              <p>Blueprint themes, addons and web apps.</p>
              <span>
                Visit our website <ArrowUpRight size={13} />
              </span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function ScrollToLocation() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const timer = setTimeout(
        () =>
          document.getElementById(location.hash.slice(1))?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "instant"
              : "smooth",
            block: "start",
          }),
        60,
      );
      return () => clearTimeout(timer);
    }
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function NotFound() {
  return (
    <main className="not-found container">
      <h1>This page isn’t here.</h1>
      <p>Use the project home or documentation to find what you need.</p>
      <Link to="/" className="button button-accent">
        Back to Aquadactyl <ArrowRight size={16} />
      </Link>
    </main>
  );
}

export default function App() {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname === "/")
      document.title = "Aquadactyl | Euphoria Development";
  }, [location.pathname]);
  return (
    <div id="top">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <ScrollToLocation />
      <Header />
      <div id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/docs" element={<Documentation page="installation" />} />
          <Route
            path="/docs/updating"
            element={<Documentation page="updating" />}
          />
          <Route
            path="/docs/blueprint"
            element={<Documentation page="blueprint" />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
