"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
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
    <header className="sticky top-0 z-50 border-b border-[#28313a] bg-[#11161b]">
      <div className="mx-auto flex h-17.5 w-full max-w-296 items-center gap-4 px-5 sm:h-18.5 sm:px-6 md:h-20.5 md:gap-5 md:px-8 lg:gap-8">
        <Link
          href="/"
          className="flex shrink-0 flex-col items-start gap-1 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#78d4cc]"
          aria-label="Aquadactyl home"
        >
          <img
            src="/brand/aquadactyl-wordmark.png"
            alt="Aquadactyl"
            className="block h-auto w-39.25 sm:w-40.5 md:w-43.25"
          />
          <span className="ml-8.5 text-[9px] font-normal text-[#8c9aa7] sm:ml-9.5 sm:text-[10px]">
            by Euphoria Development
          </span>
        </Link>
        <nav
          className="ml-auto hidden items-center gap-5 md:flex lg:gap-6.75"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            className={`flex min-h-10 items-center gap-1.5 text-xs transition-colors duration-150 lg:text-[13px] ${
              pathname === "/"
                ? "text-[#e9edf0] underline decoration-[#78d4cc] underline-offset-[9px]"
                : "text-[#a0abb6] hover:text-[#e9edf0]"
            }`}
          >
            Overview
          </Link>
          <Link
            href="/#features"
            className="flex min-h-10 items-center gap-1.5 text-xs text-[#a0abb6] transition-colors duration-150 hover:text-[#e9edf0] lg:text-[13px]"
          >
            Features
          </Link>
          <Link
            href="/#blueprint"
            className="flex min-h-10 items-center gap-1.5 text-xs text-[#a0abb6] transition-colors duration-150 hover:text-[#e9edf0] lg:text-[13px]"
          >
            Extensions
          </Link>
          <Link
            href="/docs"
            className={`flex min-h-10 items-center gap-1.5 text-xs transition-colors duration-150 lg:text-[13px] ${
              pathname.startsWith("/docs")
                ? "text-[#e9edf0] underline decoration-[#78d4cc] underline-offset-[9px]"
                : "text-[#a0abb6] hover:text-[#e9edf0]"
            }`}
          >
            Documentation
          </Link>
          <a
            href={REPOSITORY}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-10 items-center gap-1.5 text-xs text-[#a0abb6] transition-colors duration-150 hover:text-[#e9edf0] lg:text-[13px]"
          >
            <FaGithub size={14} />
            GitHub
          </a>
        </nav>
        <Link
          href="/docs"
          className="hidden min-h-10 items-center justify-center gap-2.5 rounded-md border border-[#2b7c80] bg-[#20696d] px-3.75 text-[13px] font-medium whitespace-nowrap text-[#effcfa] transition-colors duration-150 hover:border-[#55c0b7] hover:bg-[#237c7f] md:inline-flex"
        >
          Get started <ArrowRight size={14} />
        </Link>
        <button
          id="navigation-toggle"
          className="ml-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-[#3d4a56] bg-[#1b232b] text-[#e9edf0] transition-colors hover:border-[#64717f] focus-visible:outline-2 focus-visible:outline-[#78d4cc] md:hidden"
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
          className="mx-auto grid w-full max-w-296 gap-1 border-t border-[#28313a] px-5 py-2.5 pb-4.5 sm:px-6 md:px-8"
          aria-label="Mobile navigation"
        >
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center justify-between rounded-[5px] px-2.5 text-sm text-[#d7dce1] transition-colors hover:bg-[#1b232b]"
          >
            Overview
          </Link>
          <Link
            href="/#panel-preview"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center justify-between rounded-[5px] px-2.5 text-sm text-[#d7dce1] transition-colors hover:bg-[#1b232b]"
          >
            Panel preview
          </Link>
          <Link
            href="/#features"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center justify-between rounded-[5px] px-2.5 text-sm text-[#d7dce1] transition-colors hover:bg-[#1b232b]"
          >
            Features
          </Link>
          <Link
            href="/#blueprint"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center justify-between rounded-[5px] px-2.5 text-sm text-[#d7dce1] transition-colors hover:bg-[#1b232b]"
          >
            Extensions
          </Link>
          <Link
            href="/docs"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center justify-between rounded-[5px] px-2.5 text-sm text-[#d7dce1] transition-colors hover:bg-[#1b232b]"
          >
            Documentation
          </Link>
          <a
            href={COMMUNITY}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center justify-between rounded-[5px] px-2.5 text-sm text-[#d7dce1] transition-colors hover:bg-[#1b232b]"
          >
            Discord <ArrowUpRight size={14} />
          </a>
          <a
            href={REPOSITORY}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center justify-between rounded-[5px] px-2.5 text-sm text-[#d7dce1] transition-colors hover:bg-[#1b232b]"
          >
            GitHub <ArrowUpRight size={14} />
          </a>
        </nav>
      )}
    </header>
  );
}
