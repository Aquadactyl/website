"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  ChevronDown,
  Code2,
  ExternalLink,
  Puzzle,
  RefreshCw,
  Server,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FaDiscord, FaGithub } from "react-icons/fa6";
import PanelPreview from "./PanelPreview";

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

export default function Home() {
  return (
    <main>
      <section className="bg-[#11161b]" aria-labelledby="hero-heading">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-9 px-5 py-9 pb-10 min-[1051px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.3fr)] min-[1051px]:gap-14 min-[1051px]:py-16 min-[1051px]:pb-15 sm:px-6 sm:py-10 md:px-8 md:py-13.5">
          <div className="max-w-165 pb-0 min-[1051px]:max-w-none min-[1051px]:pb-4">
            <p className="flex items-center gap-2 text-[11px] text-[#a0abb6] sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#78d4cc]" />
              Open-source game server panel
            </p>
            <h1
              id="hero-heading"
              className="mt-5 font-(family-name:--font-ibm-plex-sans) text-[clamp(38px,11.5vw,54px)] leading-[1.1] font-semibold tracking-[-1.5px] text-[#f5f6f7] min-[1051px]:text-[clamp(48px,4.6vw,66px)] min-[1051px]:tracking-[-2.2px] sm:mt-6 sm:text-[62px]"
            >
              Aquadactyl
            </h1>
            <p className="mt-4.5 text-[22px] leading-[1.4] font-normal tracking-[-0.4px] text-[#d7dce1] min-[1051px]:text-[25px] sm:mt-5.5">
              A familiar panel.
              <br />
              More room to make it yours.
            </p>
            <p className="mt-4 max-w-96.25 text-sm leading-[1.85] text-[#a0abb6] max-[1050px]:max-w-145 sm:mt-5 sm:text-[15px]">
              Pterodactyl Panel with Blueprint built in. Manage your game
              servers, install extensions and build a panel that fits your
              community.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:mt-7.5">
              <Link
                href="/docs"
                className="inline-flex min-h-11.5 items-center justify-center gap-2.5 rounded-md border border-[#2b7c80] bg-[#20696d] px-4 text-[13px] font-medium text-[#effcfa] transition-colors duration-150 hover:border-[#55c0b7] hover:bg-[#237c7f] sm:px-5 sm:text-sm"
              >
                Install Aquadactyl <ArrowRight size={16} />
              </Link>
              <a
                href={"https://github.com/Aquadactyl/aquadactyl"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11.5 items-center justify-center gap-2.5 rounded-md border border-[#3d4a56] bg-[#1b232b] px-4 text-[13px] font-medium text-[#e9edf0] transition-colors duration-150 hover:border-[#64717f] hover:bg-[#26313b] sm:px-5 sm:text-sm"
              >
                <FaGithub size={16} />
                GitHub
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 sm:mt-7.5">
              <span className="inline-flex items-center gap-1.75 text-[11px] text-[#bbc5ce] sm:text-xs">
                <Server className="text-[#78d4cc]" size={15} /> Self hosted
              </span>
              <span className="inline-flex items-center gap-1.75 text-[11px] text-[#bbc5ce] sm:text-xs">
                <Puzzle className="text-[#78d4cc]" size={15} /> Blueprint
                included
              </span>
            </div>
            <p className="mt-3 text-[11px] leading-[1.7] text-[#8c9aa7] sm:text-xs">
              Free to use. Open source. MIT licensed.
            </p>
            <a
              className="mt-5 inline-flex items-center gap-2 text-[13px] text-[#a4e3dc] hover:underline min-[1051px]:hidden"
              href="#panel-preview"
            >
              Explore the panel <ArrowRight size={15} />
            </a>
          </div>
          <div className="w-full min-w-0">
            <PanelPreview />
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-296 px-5 sm:px-6 md:px-8">
        <div className="flex flex-col justify-between gap-3 border-y border-[#28313a] py-5.5 min-[1051px]:flex-row min-[1051px]:items-center min-[1051px]:gap-6 min-[1051px]:py-6.25">
          <span className="text-xs text-[#8c9aa7]">
            For the games your community plays
          </span>
          <p className="text-xs leading-[1.8] text-[#bbc5ce] sm:text-[13px]">
            Minecraft <span className="mx-1.5 text-[#64717f] sm:mx-3">·</span>{" "}
            Rust <span className="mx-1.5 text-[#64717f] sm:mx-3">·</span>{" "}
            Terraria <span className="mx-1.5 text-[#64717f] sm:mx-3">·</span>{" "}
            Valheim <span className="mx-1.5 text-[#64717f] sm:mx-3">·</span>{" "}
            Counter-Strike
          </p>
        </div>
      </div>

      <section
        id="features"
        className="mx-auto w-full max-w-296 px-5 py-11 sm:px-6 sm:py-14 md:px-8 md:py-19"
        aria-labelledby="features-heading"
      >
        <div className="mb-7 flex flex-col justify-between gap-4 sm:mb-9 md:flex-row md:items-end md:gap-8">
          <div>
            <p className="mb-3 text-[11px] font-medium tracking-widest text-[#8c9aa7] uppercase">
              The essentials, together
            </p>
            <h2
              id="features-heading"
              className="text-[27px] leading-tight font-medium tracking-[-0.8px] text-[#e9edf0] sm:text-[29px] md:text-[32px]"
            >
              What’s included
            </h2>
          </div>
          <p className="max-w-145 text-[13px] leading-[1.85] text-[#a0abb6] sm:text-sm md:max-w-105">
            A familiar foundation, with the tools to keep your panel running and
            make it your own.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-7 sm:gap-y-4.5 lg:grid-cols-3 lg:gap-x-9 lg:gap-y-6">
          {features.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="border-t border-[#303b45] py-5.5 pb-3 sm:py-6 sm:pb-3"
            >
              <h3 className="flex items-center gap-2.5 text-base font-medium text-[#e9edf0]">
                <Icon className="shrink-0 text-[#78d4cc]" size={19} />
                {title}
              </h3>
              <p className="mt-3 text-[13px] leading-[1.85] text-[#a0abb6] sm:text-sm">
                {text}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-7 text-xs leading-[1.8] text-[#8c9aa7]">
          Use Pterodactyl eggs for Minecraft, Rust, Terraria, Valheim,
          Counter-Strike and other games.
        </p>
      </section>

      <section
        id="blueprint"
        className="border-y border-[#28313a] bg-[#151c23] py-11 sm:py-14 md:py-19"
        aria-labelledby="blueprint-heading"
      >
        <div className="mx-auto w-full max-w-296 px-5 sm:px-6 md:px-8">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-8">
            <div>
              <p className="mb-3 text-[11px] font-medium tracking-widest text-[#8c9aa7] uppercase">
                Make it yours
              </p>
              <h2
                id="blueprint-heading"
                className="text-[27px] leading-tight font-medium tracking-[-0.8px] text-[#e9edf0] sm:text-[29px] md:text-[32px]"
              >
                A panel with possibilities
              </h2>
            </div>
            <p className="max-w-145 text-[13px] leading-[1.85] text-[#a0abb6] sm:text-sm md:max-w-105">
              Blueprint is built in. Add themes and useful tools from the
              Euphoria ecosystem.
            </p>
          </div>
          <p className="mb-7.5 text-xs leading-[1.8] text-[#8c9aa7]">
            Aquadactyl includes Blueprint beta-2026-08. Individual extensions
            are installed separately.
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
            {addons.map(({ name, description, repository, type, image }) => (
              <article
                key={name}
                className="overflow-hidden rounded-lg border border-[#303b45] bg-[#1b232b]"
              >
                <img
                  className="aspect-video h-auto w-full border-b border-[#303b45] bg-[#090d11] object-contain"
                  src={image}
                  alt={name + " artwork"}
                  width={1920}
                  height={1080}
                  loading="lazy"
                  decoding="async"
                />
                <div className="p-5 sm:p-4.25 md:p-5.5">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <h3 className="text-base font-medium text-[#e9edf0] sm:text-[15px] md:text-[17px]">
                      {name}
                    </h3>
                    <span className="rounded border border-[#3a5558] px-1.75 py-0.75 text-[10px] text-[#a4e3dc]">
                      {type}
                    </span>
                  </div>
                  <p className="mt-2.5 min-h-0 text-[13px] leading-[1.8] text-[#a0abb6] sm:min-h-11.75">
                    {description}
                  </p>
                  <a
                    href={"https://github.com/EuphoriaTheme/" + repository}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4.5 inline-flex min-h-8 items-center gap-2 text-xs font-medium text-[#d7dce1] transition-colors hover:text-[#a4e3dc]"
                  >
                    View on GitHub <FaGithub size={14} />
                  </a>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-7 flex flex-col flex-wrap gap-2.5 sm:flex-row sm:items-center sm:gap-7">
            <a
              href={"https://euphoriadevelopment.uk" + "/#blueprints"}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-8 items-center gap-1.75 text-[13px] text-[#a4e3dc] underline-offset-4 hover:underline"
            >
              Browse Euphoria blueprints <ExternalLink size={14} />
            </a>
            <Link
              href="/docs/manual-install/additional-configuration#blueprint"
              className="flex min-h-8 items-center gap-1.75 text-[13px] text-[#a4e3dc] underline-offset-4 hover:underline"
            >
              Blueprint setup guide <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section
        id="get-started"
        className="mx-auto w-full max-w-296 px-5 py-11 sm:px-6 sm:py-14 md:px-8 md:py-19"
        aria-labelledby="install-heading"
      >
        <div className="flex flex-col justify-between gap-6 rounded-[9px] border border-[#303b45] bg-[#1b232b] p-6 sm:p-8 md:flex-row md:items-center">
          <div>
            <p className="mb-2 text-[11px] font-medium tracking-widest text-[#8c9aa7] uppercase">
              Your next step
            </p>
            <h2
              id="install-heading"
              className="text-[27px] leading-tight font-medium tracking-[-0.8px] text-[#e9edf0] sm:text-[29px] md:text-[32px]"
            >
              Get up and running
            </h2>
            <p className="mt-2 text-[13px] leading-[1.85] text-[#a0abb6] sm:text-sm">
              Follow our guide for a new panel installation, managed updates,
              and extension configuration.
            </p>
          </div>
          <Link
            href="/docs"
            className="inline-flex min-h-11.5 shrink-0 items-center justify-center gap-2.5 rounded-md border border-[#2b7c80] bg-[#20696d] px-5 text-sm font-medium whitespace-nowrap text-[#effcfa] transition-colors duration-150 hover:border-[#55c0b7] hover:bg-[#237c7f]"
          >
            Installation guide <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section
        className="mx-auto grid w-full max-w-296 grid-cols-1 gap-0 px-5 pb-11 sm:px-6 sm:pb-14 md:px-8 md:pb-19 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)] lg:gap-16"
        aria-labelledby="questions-heading"
      >
        <div className="mb-7 flex flex-col items-start gap-4 sm:mb-9 lg:mb-0">
          <div>
            <p className="mb-3 text-[11px] font-medium tracking-widest text-[#8c9aa7] uppercase">
              Good to know
            </p>
            <h2
              id="questions-heading"
              className="text-[27px] leading-tight font-medium tracking-[-0.8px] text-[#e9edf0] sm:text-[29px] md:text-[32px]"
            >
              Common questions
            </h2>
          </div>
        </div>
        <div className="min-w-0">
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
            <details
              key={question}
              className="group border-b border-[#303b45] first:border-t first:border-[#303b45]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5.5 text-[13px] leading-[1.6] text-[#e9edf0] sm:text-sm">
                {question}
                <ChevronDown
                  className="shrink-0 text-[#8c9aa7] transition-transform duration-150 group-open:rotate-180"
                  size={17}
                />
              </summary>
              <p className="pr-6 pb-5.5 text-[13px] leading-[1.85] text-[#a0abb6] sm:text-sm">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section
        className="border-t border-[#28313a] bg-[#151c23] py-11 sm:py-14 md:py-16"
        aria-labelledby="community-heading"
      >
        <div className="mx-auto w-full max-w-296 px-5 sm:px-6 md:px-8">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:mb-9 md:flex-row md:items-end md:gap-8">
            <div>
              <p className="mb-3 text-[11px] font-medium tracking-widest text-[#8c9aa7] uppercase">
                Built in the open
              </p>
              <h2
                id="community-heading"
                className="text-[27px] leading-tight font-medium tracking-[-0.8px] text-[#e9edf0] sm:text-[29px] md:text-[32px]"
              >
                Join the community
              </h2>
            </div>
            <p className="max-w-145 text-[13px] leading-[1.85] text-[#a0abb6] sm:text-sm md:max-w-105">
              Contribute, get support or see our other projects.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
            <a
              href={"https://github.com/Aquadactyl/aquadactyl"}
              target="_blank"
              rel="noreferrer"
              className="relative block rounded-lg border border-[#303b45] bg-[#1b232b] p-5 transition-all duration-150 hover:border-[#52616f] hover:bg-[#202a33] sm:p-5 md:p-6.5"
            >
              <FaGithub className="text-[#a4e3dc]" size={24} />
              <h3 className="mt-4.5 text-base font-medium text-[#e9edf0] sm:text-[15px] md:text-[17px]">
                GitHub
              </h3>
              <p className="mt-2.25 text-[13px] leading-[1.8] text-[#a0abb6]">
                Read the source, report a bug or contribute.
              </p>
              <span className="mt-4.5 inline-flex items-center gap-1.5 text-xs text-[#a4e3dc]">
                Open repository <ArrowUpRight size={13} />
              </span>
            </a>
            <a
              href={"https://discord.euphoriadevelopment.uk"}
              target="_blank"
              rel="noreferrer"
              className="relative block rounded-lg border border-[#303b45] bg-[#1b232b] p-5 transition-all duration-150 hover:border-[#52616f] hover:bg-[#202a33] sm:p-5 md:p-6.5"
            >
              <FaDiscord className="text-[#a4e3dc]" size={24} />
              <h3 className="mt-4.5 text-base font-medium text-[#e9edf0] sm:text-[15px] md:text-[17px]">
                Discord
              </h3>
              <p className="mt-2.25 text-[13px] leading-[1.8] text-[#a0abb6]">
                Ask questions and join the community.
              </p>
              <span className="mt-4.5 inline-flex items-center gap-1.5 text-xs text-[#a4e3dc]">
                Join Discord <ArrowUpRight size={13} />
              </span>
            </a>
            <a
              href={"https://euphoriadevelopment.uk"}
              target="_blank"
              rel="noreferrer"
              className="relative block rounded-lg border border-[#303b45] bg-[#1b232b] p-5 transition-all duration-150 hover:border-[#52616f] hover:bg-[#202a33] sm:p-5 md:p-6.5"
            >
              <img
                src="/brand/euphoria.png"
                alt=""
                className="h-6 w-6 object-contain"
              />
              <h3 className="mt-4.5 text-base font-medium text-[#e9edf0] sm:text-[15px] md:text-[17px]">
                Euphoria Development
              </h3>
              <p className="mt-2.25 text-[13px] leading-[1.8] text-[#a0abb6]">
                Blueprint themes, addons and web apps.
              </p>
              <span className="mt-4.5 inline-flex items-center gap-1.5 text-xs text-[#a4e3dc]">
                Visit our website <ArrowUpRight size={13} />
              </span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
