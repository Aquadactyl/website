"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Blocks, BookOpen, Bug, CalendarClock, Clipboard,
  Code2, Container, EyeOff, Gauge, KeyRound, Languages, Link2,
  ListFilter, Mail, Palette, Puzzle, Radio, RefreshCw, Search,
  ShieldCheck, Trash2, UserPlus, UserRound, Users,
} from "lucide-react";
import {
  featureCategories, panelFeatures, panelReview, panelSource,
  type FeatureCategory,
} from "@/lib/panel-features";

const icons = { Blocks, BookOpen, Bug, CalendarClock, Clipboard, Code2, Container, EyeOff, Gauge, KeyRound, Languages, Link2, ListFilter, Mail, Palette, Puzzle, Radio, RefreshCw, Search, ShieldCheck, Trash2, UserPlus, UserRound, Users };

export default function FeatureComparison() {
  const [category, setCategory] = useState<FeatureCategory | "All">("All");
  const visible = panelFeatures.filter((feature) => category === "All" || feature.category === category);
  return (
    <>
      <section id="features" className="mx-auto w-full max-w-296 px-5 py-11 sm:px-6 sm:py-14 md:px-8 md:py-19" aria-labelledby="features-heading">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-8">
          <div>
            <p className="mb-3 text-[11px] font-medium tracking-widest text-[#8c9aa7] uppercase">Built on Pterodactyl</p>
            <h2 id="features-heading" className="text-[27px] leading-tight font-medium tracking-[-0.8px] text-[#e9edf0] sm:text-[29px] md:text-[32px]">More of the panel, made yours.</h2>
          </div>
          <p className="max-w-145 text-[13px] leading-[1.85] text-[#a0abb6] sm:text-sm md:max-w-105">
            {panelFeatures.length} documented feature areas, from everyday server tools to account security, extensions and deployment.
          </p>
        </div>
        <div className="mb-7 flex flex-wrap gap-2" role="group" aria-label="Filter feature areas">
          {(["All", ...featureCategories] as const).map((name) => (
            <button key={name} type="button" aria-pressed={category === name} onClick={() => setCategory(name)}
              className={`min-h-10 cursor-pointer rounded-full border px-3.5 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#78d4cc] ${category === name ? "border-[#4b8f89] bg-[#1c3638] text-[#c4f3eb]" : "border-[#303b45] bg-[#151c23] text-[#b7c3cc] hover:border-[#64717f] hover:text-[#e9edf0]"}`}>
              {name} <span className="ml-1 text-[10px] opacity-65">{name === "All" ? panelFeatures.length : panelFeatures.filter((feature) => feature.category === name).length}</span>
            </button>
          ))}
        </div>
        <p className="sr-only" role="status">Showing {visible.length} feature areas. The comparison table uses the same filter.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-7 sm:gap-y-4.5 lg:grid-cols-3 lg:gap-x-9 lg:gap-y-6">
          {visible.map((feature) => {
            const Icon = icons[feature.icon as keyof typeof icons];
            return (
              <article key={feature.id} className="border-t border-[#303b45] py-5.5 pb-3 sm:py-6 sm:pb-3">
                <div className="mb-3 flex items-center justify-between gap-2 text-[10px]">
                  <span className="text-[#8c9aa7]">{feature.category}</span>
                  {feature.availability === "Off by default" && <span className="rounded border border-[#685339] px-1.5 py-0.5 text-[#e3c699]">Off by default</span>}
                </div>
                <h3 className="flex items-center gap-2.5 text-base font-medium text-[#e9edf0]">
                  <Icon className="shrink-0 text-[#78d4cc]" size={19} aria-hidden />{feature.title}
                </h3>
                <p className="mt-3 text-[13px] leading-[1.85] text-[#a0abb6] sm:text-sm">{feature.text}</p>
                <Link href={feature.href} className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs text-[#a4e3dc] hover:underline" aria-label={`Learn more about ${feature.title}`}>
                  Learn more <ArrowRight size={13} aria-hidden />
                </Link>
              </article>
            );
          })}
        </div>
        <p className="mt-7 max-w-220 text-xs leading-[1.8] text-[#8c9aa7]">
          Console, files, backups, databases, subusers, TOTP and Docker isolation through Wings are part of the shared Pterodactyl foundation. Administrators choose which optional Aquadactyl tools users see.
        </p>
      </section>

      <section id="comparison" className="mx-auto w-full max-w-296 px-5 pb-11 sm:px-6 sm:pb-14 md:px-8 md:pb-19" aria-labelledby="comparison-heading">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[11px] font-medium tracking-widest text-[#8c9aa7] uppercase">The details, side by side</p>
            <h2 id="comparison-heading" className="text-[27px] leading-tight font-medium tracking-[-0.8px] text-[#e9edf0] sm:text-[29px] md:text-[32px]">Aquadactyl & Pterodactyl</h2>
          </div>
          <a href="#features" className="inline-flex min-h-10 items-center text-xs text-[#a4e3dc] hover:underline">{category === "All" ? "All feature areas" : category} · change filter ↑</a>
        </div>
        <p id="comparison-description" className="mt-4 max-w-205 text-sm leading-[1.85] text-[#a0abb6]">
          Stock Pterodactyl {panelReview.pterodactylRelease} compared with the reviewed Aquadactyl source. Rows describe additions and extensions to existing behavior. Third-party themes, extensions and operator configuration can change the comparison.
        </p>
        <div className="mt-7 overflow-x-auto rounded-lg border border-[#303b45] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#78d4cc]" role="region" aria-labelledby="comparison-heading" tabIndex={0}>
          <table className="w-full min-w-160 border-collapse text-left text-[13px] leading-[1.8]" aria-describedby="comparison-description">
            <caption className="sr-only">{visible.length} feature areas compared with Pterodactyl, plus the shared server-management foundation.</caption>
            <thead className="bg-[#1b232b] text-[#e9edf0]">
              <tr>
                <th scope="col" className="w-1/5 px-5 py-4 font-medium">Feature area</th>
                <th scope="col" className="w-2/5 px-5 py-4 font-medium">Pterodactyl <span className="block text-[10px] font-normal text-[#8c9aa7]">{panelReview.pterodactylRelease} · stock panel</span></th>
                <th scope="col" className="w-2/5 bg-[#193031] px-5 py-4 font-medium text-[#b7f0e5]">Aquadactyl <span className="block text-[10px] font-normal text-[#99bcb7]">Built-in tools & configurable additions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((feature) => (
                <tr key={feature.id} className="border-t border-[#303b45]">
                  <th scope="row" className="px-5 py-4 align-top font-medium text-[#e9edf0]">
                    <Link href={feature.href} className="underline-offset-4 hover:underline">{feature.title}</Link>
                    <span className="mt-1 block text-[10px] font-normal text-[#8c9aa7]">{feature.category}</span>
                  </th>
                  <td className="px-5 py-4 align-top text-[#a0abb6]">{feature.upstream}</td>
                  <td className="bg-[#162526] px-5 py-4 align-top text-[#c2d6d1]">
                    {feature.text}
                    <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                      <span className={feature.availability === "Off by default" ? "text-[#e3c699]" : "text-[#8dbdb3]"}>{feature.availability}</span>
                      <a href={panelSource("aquadactyl", feature.source)} className="min-h-6 underline underline-offset-2 hover:text-[#effcfa]" target="_blank" rel="noreferrer" aria-label={`Aquadactyl source for ${feature.title}`}>Source ↗</a>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-[#42524f] bg-[#1b232b]">
                <th scope="row" className="px-5 py-4 align-top font-medium text-[#e9edf0]">Core server management</th>
                <td className="px-5 py-4 align-top text-[#a0abb6]">Console, files, backups, databases, schedules, subusers, API access and Wings-based Docker servers.</td>
                <td className="px-5 py-4 align-top text-[#c2d6d1]">Retains the Pterodactyl foundation, with the additions above.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[11px] leading-[1.8] text-[#8c9aa7]">
          Reviewed {panelReview.reviewedOn}. Sources: <a href={panelSource("pterodactyl")} target="_blank" rel="noreferrer" className="text-[#b7c3cc] underline underline-offset-3">Pterodactyl {panelReview.pterodactylRelease}</a>{" "}and{" "}<a href={panelSource("aquadactyl")} target="_blank" rel="noreferrer" className="text-[#b7c3cc] underline underline-offset-3">Aquadactyl {panelReview.aquadactyl.slice(0, 12)}</a>. Feature defaults and setup details are in the <Link href="/docs/panel/features" className="text-[#b7c3cc] underline underline-offset-3">feature guide</Link>.
        </p>
      </section>
    </>
  );
}
