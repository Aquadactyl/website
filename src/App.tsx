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
          <img src="/brand/aquadactyl-wordmark.png" alt="Aquadactyl" />
          <span>by Euphoria Development</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <NavLink end to="/">
            Overview
          </NavLink>
          <Link to="/#features">Features</Link>
          <Link to="/#blueprint">Extensions</Link>
          <NavLink to="/docs">Documentation</NavLink>
          <a href={REPOSITORY} target="_blank" rel="noreferrer">
            <Github size={14} />
            GitHub
          </a>
        </nav>
        <Link to="/docs" className="button button-accent header-cta">
          Get started <ArrowRight size={14} />
        </Link>
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
          <Link to="/">Overview</Link>
          <Link to="/#panel-preview">Panel preview</Link>
          <Link to="/#features">Features</Link>
          <Link to="/#blueprint">Extensions</Link>
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
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-content container">
          <div className="hero-copy">
            <p className="project-owner">
              <span className="project-dot" /> Open-source game server panel
            </p>
            <h1 id="hero-heading">Aquadactyl</h1>
            <p className="hero-tagline">
              A familiar panel.
              <br />
              More room to make it yours.
            </p>
            <p className="hero-description">
              Pterodactyl Panel with Blueprint built in. Manage your game
              servers, install extensions and build a panel that fits your
              community.
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
            <div className="hero-highlights">
              <span>
                <Server size={15} /> Self hosted
              </span>
              <span>
                <Puzzle size={15} /> Blueprint included
              </span>
            </div>
            <p className="hero-meta">Free to use. Open source. MIT licensed.</p>
            <a className="hero-demo-link" href="#panel-preview">
              Explore the panel <ArrowRight size={15} />
            </a>
          </div>
          <div className="hero-demo">
            <PanelPreview />
          </div>
        </div>
      </section>
      <div className="games-strip container">
        <span>For the games your community plays</span>
        <p>
          Minecraft <span>·</span> Rust <span>·</span> Terraria <span>·</span>{" "}
          Valheim <span>·</span> Counter-Strike
        </p>
      </div>
      <section
        id="features"
        className="features-section container"
        aria-labelledby="features-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">The essentials, together</p>
            <h2 id="features-heading">What’s included</h2>
          </div>
          <p>
            A familiar foundation, with the tools to keep your panel running and
            make it your own.
          </p>
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
            <div>
              <p className="eyebrow">Make it yours</p>
              <h2 id="blueprint-heading">A panel with possibilities</h2>
            </div>
            <p>
              Blueprint is built in. Add themes and useful tools from the
              Euphoria ecosystem.
            </p>
          </div>
          <p className="blueprint-description">
            Aquadactyl includes Blueprint beta-2026-08. Individual extensions
            are installed separately.
          </p>
          <div className="addons-grid">
            {addons.map(({ name, description, repository, type, image }) => (
              <article key={name} className="addon-card">
                <img
                  className="addon-image"
                  src={image}
                  alt={name + " artwork"}
                  width={1920}
                  height={1080}
                  loading="lazy"
                  decoding="async"
                />
                <div className="addon-copy">
                  <div className="addon-heading">
                    <h3>{name}</h3>
                    <span>{type}</span>
                  </div>
                  <p>{description}</p>
                  <a
                    href={"https://github.com/EuphoriaTheme/" + repository}
                    target="_blank"
                    rel="noreferrer"
                    className="resource-link"
                  >
                    View on GitHub <Github size={14} />
                  </a>
                </div>
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
          <div>
            <p className="eyebrow">Your next step</p>
            <h2 id="install-heading">Get up and running</h2>
          </div>
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
          <div>
            <p className="eyebrow">Good to know</p>
            <h2 id="questions-heading">Common questions</h2>
          </div>
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
            <div>
              <p className="eyebrow">Built in the open</p>
              <h2 id="community-heading">Join the community</h2>
            </div>
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
