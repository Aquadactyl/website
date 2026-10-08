"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import Github from "./GithubIcon";
import { COMMUNITY, REPOSITORY } from "../config";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

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
        <Link href="/" className="brand" aria-label="Aquadactyl home">
          <img src="/brand/aquadactyl-wordmark.png" alt="Aquadactyl" />
          <span>by Euphoria Development</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/" className={pathname === "/" ? "active" : undefined}>
            Overview
          </Link>
          <Link href="/#features">Features</Link>
          <Link href="/#blueprint">Extensions</Link>
          <Link
            href="/docs"
            className={pathname.startsWith("/docs") ? "active" : undefined}
          >
            Documentation
          </Link>
          <a href={REPOSITORY} target="_blank" rel="noreferrer">
            <Github size={14} />
            GitHub
          </a>
        </nav>
        <Link href="/docs" className="button button-accent header-cta">
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
          <Link href="/" onClick={() => setOpen(false)}>
            Overview
          </Link>
          <Link href="/#panel-preview" onClick={() => setOpen(false)}>
            Panel preview
          </Link>
          <Link href="/#features" onClick={() => setOpen(false)}>
            Features
          </Link>
          <Link href="/#blueprint" onClick={() => setOpen(false)}>
            Extensions
          </Link>
          <Link href="/docs" onClick={() => setOpen(false)}>
            Documentation
          </Link>
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
