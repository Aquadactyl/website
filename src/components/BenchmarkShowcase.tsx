"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowDown,
  Download,
  FlaskConical,
  Timer,
  Zap,
} from "lucide-react";
import results from "../../public/benchmarks/panels.json";
import RuntimeBenchmarks from "./RuntimeBenchmarks";

type Metric = "payload" | "javascript" | "build";
const metrics: { id: Metric; label: string }[] = [
  { id: "payload", label: "Dashboard scripts + styles" },
  { id: "javascript", label: "Dashboard JavaScript" },
  { id: "build", label: "Production build" },
];
const percent = (a: number, p: number) => ((1 - a / p) * 100).toFixed(1);
const bytes = (value: number) => `${(value / 1024).toFixed(1)} KiB`;
const seconds = (value: number) => `${(value / 1000).toFixed(2)} s`;
const measuredOn = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${results.measuredOn}T12:00:00Z`));

export default function BenchmarkShowcase() {
  const [metric, setMetric] = useState<Metric>("payload");
  const [compressed, setCompressed] = useState(true);
  const { aquadactyl: aqua, pterodactyl: ptero } = results.panels;
  const payloadSaving = percent(
    aqua.dashboard.totalGzipBytes,
    ptero.dashboard.totalGzipBytes,
  );
  const buildRatio = ptero.buildMs.median / aqua.buildMs.median;
  const measurements = {
    payload: {
      a: compressed ? aqua.dashboard.totalGzipBytes : aqua.dashboard.totalBytes,
      p: compressed
        ? ptero.dashboard.totalGzipBytes
        : ptero.dashboard.totalBytes,
    },
    javascript: {
      a: compressed ? aqua.dashboard.jsGzipBytes : aqua.dashboard.jsBytes,
      p: compressed ? ptero.dashboard.jsGzipBytes : ptero.dashboard.jsBytes,
    },
    build: { a: aqua.buildMs.median, p: ptero.buildMs.median },
  }[metric];
  const formatter = metric === "build" ? seconds : bytes;
  const maximum = Math.max(measurements.a, measurements.p);
  const labels = {
    payload:
      "JavaScript and CSS required by the first authenticated dashboard route, with each emitted asset counted once.",
    javascript:
      "Dashboard entry, route and static-import JavaScript. Aquadactyl emits CSS separately; use scripts + styles for the fuller comparison.",
    build:
      "Median of five production builds per panel, each in a fresh process after one warm-up, with alternating run order.",
  };
  return (
    <section
      id="benchmarks"
      className="relative overflow-hidden border-y border-[#303b45] bg-[#131c21] py-12 sm:py-16 md:py-20"
      aria-labelledby="benchmark-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(52,152,142,0.15),transparent_60%)]"
      />
      <div className="relative mx-auto w-full max-w-296 px-5 sm:px-6 md:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[11px] font-medium tracking-widest text-[#9fc4be] uppercase">
              <FlaskConical size={14} aria-hidden /> Measured on the same
              machine
            </p>
            <h2
              id="benchmark-heading"
              className="max-w-160 text-[30px] leading-[1.15] font-medium tracking-[-1px] text-[#eff8f5] sm:text-[36px] md:text-[42px]"
            >
              A lighter dashboard.
              <br />A quicker build.
            </h2>
          </div>
          <p className="max-w-105 text-[13px] leading-[1.85] text-[#a8babf]">
            Production frontend benchmarks from clean source checkouts, using
            each panel's locked dependencies and default build configuration.
          </p>
        </div>

        <div className="mb-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#3b6862] bg-[#193130] p-5 sm:p-6">
            <p className="mb-5 flex items-center gap-2 text-xs text-[#b3d8ce]">
              <Download size={15} aria-hidden /> Dashboard scripts + styles
            </p>
            <p className="font-mono text-[42px] leading-none font-medium tracking-[-2px] text-[#c1fae3] sm:text-[46px]">
              {payloadSaving}
              <span className="ml-1 text-[24px]">%</span>
            </p>
            <p className="mt-3 text-sm text-[#dcf0e8]">less data under gzip</p>
            <p className="mt-2 text-[11px] leading-relaxed text-[#a2bfb6]">
              {bytes(ptero.dashboard.totalGzipBytes)} →{" "}
              {bytes(aqua.dashboard.totalGzipBytes)}
            </p>
          </div>
          <div className="rounded-xl border border-[#35474d] bg-[#19252c] p-5 sm:p-6">
            <p className="mb-5 flex items-center gap-2 text-xs text-[#a9c4cd]">
              <Zap size={15} aria-hidden /> Production build ratio
            </p>
            <p className="font-mono text-[42px] leading-none font-medium tracking-[-2px] text-[#d2eaf1] sm:text-[46px]">
              {buildRatio.toFixed(1)}
              <span className="ml-1 text-[24px]">×</span>
            </p>
            <p className="mt-3 text-sm text-[#dce9ed]">
              Pterodactyl ÷ Aquadactyl
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-[#9fb2bc]">
              {seconds(ptero.buildMs.median)} → {seconds(aqua.buildMs.median)}{" "}
              median
            </p>
          </div>
          <div className="rounded-xl border border-[#35474d] bg-[#19252c] p-5 sm:p-6">
            <p className="mb-5 flex items-center gap-2 text-xs text-[#a9c4cd]">
              <Timer size={15} aria-hidden /> Aquadactyl build range
            </p>
            <p className="font-mono text-[42px] leading-none font-medium tracking-[-2px] text-[#e9edf0] sm:text-[46px]">
              {(aqua.buildMs.median / 1000).toFixed(2)}
              <span className="ml-1 text-[24px]">s</span>
            </p>
            <p className="mt-3 text-sm text-[#dce9ed]">median of five builds</p>
            <p className="mt-2 text-[11px] leading-relaxed text-[#9fb2bc]">
              Range {seconds(aqua.buildMs.min)}–{seconds(aqua.buildMs.max)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[#35474d] bg-[#10191f] p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label="Benchmark metric"
            >
              {metrics.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={metric === id}
                  onClick={() => setMetric(id)}
                  className={`min-h-10 cursor-pointer rounded-md border px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#78d4cc] ${metric === id ? "border-[#4a7b73] bg-[#203e3b] text-[#d4f6e8]" : "border-transparent text-[#a5b6c0] hover:bg-[#1b2830]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {metric !== "build" && (
              <div
                className="flex gap-1 rounded-md border border-[#35474d] p-1"
                role="group"
                aria-label="Asset compression"
              >
                {[true, false].map((value) => (
                  <button
                    key={String(value)}
                    type="button"
                    aria-pressed={compressed === value}
                    onClick={() => setCompressed(value)}
                    className={`min-h-8 cursor-pointer rounded px-3 text-[11px] focus-visible:outline-2 focus-visible:outline-[#78d4cc] ${compressed === value ? "bg-[#2c4146] text-[#e9edf0]" : "text-[#9fb2bc]"}`}
                  >
                    {value ? "gzip estimate" : "Uncompressed"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="my-7 space-y-6" aria-live="polite" aria-atomic="true">
            {[
              {
                name: `Pterodactyl ${ptero.ref}`,
                value: measurements.p,
                color: "bg-[#607480]",
                label: "text-[#c3cdd4]",
              },
              {
                name: "Aquadactyl",
                value: measurements.a,
                color: "bg-linear-to-r from-[#2e8a80] to-[#9ee7c4]",
                label: "text-[#c1fae3]",
              },
            ].map(({ name, value, color, label }) => (
              <div key={name}>
                <div
                  className={`mb-2 flex items-center justify-between gap-3 text-xs ${label}`}
                >
                  <span>{name}</span>
                  <span className="shrink-0 font-mono tabular-nums">
                    {formatter(value)}
                  </span>
                </div>
                <div
                  className="h-8 overflow-hidden rounded-sm bg-[#1a282f]"
                  aria-hidden
                >
                  <div
                    className={`h-full rounded-sm transition-[width] duration-500 motion-reduce:transition-none ${color}`}
                    style={{ width: `${(value / maximum) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 border-t border-[#2c3c44] pt-4 text-xs leading-[1.8] text-[#a5b6c0]">
            <ArrowDown
              className="mt-0.5 shrink-0 text-[#91d5bd]"
              size={14}
              aria-hidden
            />
            <p>
              Lower is better. {labels[metric]}{" "}
              {metric !== "build" && compressed
                ? "gzip values are transfer estimates from emitted files."
                : ""}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col justify-between gap-3 text-[11px] leading-[1.8] text-[#8fa4ae] sm:flex-row sm:gap-8">
          <p className="max-w-185">
            Measured {measuredOn} · {results.environment.cpu} · Node{" "}
            {results.environment.node} · No installed third-party addons. These
            results measure frontend artifacts and build duration. Browser load
            time, API throughput and memory use are measured separately below.
            Game performance is outside this panel benchmark.
          </p>
          <Link
            href="/docs/panel/benchmarks"
            className="inline-flex min-h-10 shrink-0 items-center gap-2 self-start text-xs text-[#b8e6d6] hover:underline"
          >
            Methodology & raw results <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
        <RuntimeBenchmarks />
      </div>
    </section>
  );
}
