"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Globe, MemoryStick, Network } from "lucide-react";
import report from "../../public/benchmarks/runtime-summary.json";

type Mode = "browser" | "api" | "memory";
type BrowserMetric = "dashboardReadyMs" | "fcpMs" | "lcpMs" | "loadMs";
const browserMetrics: Record<BrowserMetric, string> = {
  dashboardReadyMs: "Dashboard ready",
  fcpMs: "First contentful paint",
  lcpMs: "Largest contentful paint",
  loadMs: "Window load event",
};
const controlClass =
  "min-h-10 rounded-md border border-[#35474d] bg-[#19252c] px-3 text-xs text-[#dce9ed] focus-visible:outline-2 focus-visible:outline-[#78d4cc]";

export default function RuntimeBenchmarks() {
  const [mode, setMode] = useState<Mode>("browser");
  const [cache, setCache] = useState<"cold" | "warm">("cold");
  const [browserMetric, setBrowserMetric] =
    useState<BrowserMetric>("dashboardReadyMs");
  const [endpoint, setEndpoint] = useState<"account" | "servers">("servers");
  const [concurrency, setConcurrency] = useState<"1" | "8" | "16">("16");
  const [memoryState, setMemoryState] = useState<"idle" | "loaded">("loaded");
  const [memoryScope, setMemoryScope] = useState<
    "panelWorkingSetBytes" | "stackWorkingSetBytes"
  >("panelWorkingSetBytes");
  const { aquadactyl: aqua, pterodactyl: ptero } = report.panels;
  const values = [ptero, aqua].map((panel) =>
    mode === "browser"
      ? panel.browser[cache][browserMetric].median
      : mode === "api"
        ? panel.api[endpoint][concurrency].requestsPerSecond.median
        : panel.memory[memoryState][memoryScope].median,
  );
  const format = (value: number) =>
    mode === "browser"
      ? `${value.toFixed(1)} ms`
      : mode === "api"
        ? `${value.toFixed(1)} req/s`
        : `${(value / 2 ** 20).toFixed(1)} MiB`;
  const metricLabel =
    mode === "browser"
      ? browserMetrics[browserMetric]
      : mode === "api"
        ? "Successful API responses"
        : memoryScope === "panelWorkingSetBytes"
          ? "Panel container working set"
          : "Panel + database + Redis working set";
  const maximum = Math.max(...values);
  const details =
    mode === "browser"
      ? "Ten authenticated dashboard loads per cache profile, on localhost. Dashboard ready means all 50 server names are in the DOM; it is a custom milestone. Cold refers to browser cache; server caches stay warm."
      : mode === "api"
        ? "Median of three 10-second authenticated GET windows, with persistent connections and matching data. Rate-limit caps raised equally. Each request must return HTTP 200 and the expected JSON."
        : "Median of 30 container memory samples per state. Working set excludes inactive file cache. Loaded uses the 50-server API at concurrency 16. The panel contains four PHP workers, nginx and a queue worker.";

  return (
    <div
      id="runtime-benchmarks"
      className="mt-12 scroll-mt-8 border-t border-[#35474d] pt-9"
      aria-labelledby="runtime-heading"
    >
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[11px] tracking-widest text-[#9fc4be] uppercase">
            Running panels, measured directly
          </p>
          <h3
            id="runtime-heading"
            className="text-[26px] font-medium tracking-[-0.6px] text-[#eff8f5] sm:text-[30px]"
          >
            Beyond the build.
          </h3>
        </div>
        <p className="max-w-105 text-xs leading-relaxed text-[#a8babf]">
          Matching local stacks, pinned source revisions and a real Chromium
          browser. Explore each result on its own terms.
        </p>
      </div>
      <div className="rounded-xl border border-[#35474d] bg-[#10191f] p-5 sm:p-7">
        <div
          className="mb-6 flex flex-wrap gap-2"
          role="group"
          aria-label="Runtime benchmark category"
        >
          {(
            [
              { id: "browser", label: "Browser load", Icon: Globe },
              { id: "api", label: "API throughput", Icon: Network },
              { id: "memory", label: "Memory use", Icon: MemoryStick },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              type="button"
              key={id}
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-4 text-xs focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#78d4cc] ${mode === id ? "border-[#4a7b73] bg-[#203e3b] text-[#d4f6e8]" : "border-[#2a3a41] text-[#a5b6c0] hover:bg-[#1b2830]"}`}
            >
              <Icon size={15} aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <div className="mb-7 flex flex-wrap gap-3">
          {mode === "browser" && (
            <>
              <label className="flex flex-col gap-2 text-[10px] text-[#a5b6c0]">
                Timing
                <select
                  aria-label="Browser timing"
                  className={controlClass}
                  value={browserMetric}
                  onChange={(event) =>
                    setBrowserMetric(event.target.value as BrowserMetric)
                  }
                >
                  {Object.entries(browserMetrics).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-[10px] text-[#a5b6c0]">
                Browser cache
                <select
                  aria-label="Browser cache"
                  className={controlClass}
                  value={cache}
                  onChange={(event) =>
                    setCache(event.target.value as typeof cache)
                  }
                >
                  <option value="cold">Cold cache</option>
                  <option value="warm">Warm reload</option>
                </select>
              </label>
            </>
          )}
          {mode === "api" && (
            <>
              <label className="flex flex-col gap-2 text-[10px] text-[#a5b6c0]">
                Endpoint
                <select
                  aria-label="API endpoint"
                  className={controlClass}
                  value={endpoint}
                  onChange={(event) =>
                    setEndpoint(event.target.value as typeof endpoint)
                  }
                >
                  <option value="servers">50-server list</option>
                  <option value="account">Account details</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-[10px] text-[#a5b6c0]">
                Concurrent requests
                <select
                  aria-label="API concurrency"
                  className={controlClass}
                  value={concurrency}
                  onChange={(event) =>
                    setConcurrency(event.target.value as typeof concurrency)
                  }
                >
                  {["1", "8", "16"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          {mode === "memory" && (
            <>
              <label className="flex flex-col gap-2 text-[10px] text-[#a5b6c0]">
                Workload
                <select
                  aria-label="Memory workload"
                  className={controlClass}
                  value={memoryState}
                  onChange={(event) =>
                    setMemoryState(event.target.value as typeof memoryState)
                  }
                >
                  <option value="loaded">During API load</option>
                  <option value="idle">Idle</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-[10px] text-[#a5b6c0]">
                Included services
                <select
                  aria-label="Memory scope"
                  className={controlClass}
                  value={memoryScope}
                  onChange={(event) =>
                    setMemoryScope(event.target.value as typeof memoryScope)
                  }
                >
                  <option value="panelWorkingSetBytes">Panel container</option>
                  <option value="stackWorkingSetBytes">
                    Panel + database + Redis
                  </option>
                </select>
              </label>
            </>
          )}
        </div>
        <div aria-live="polite" aria-atomic="true">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <h4 className="font-medium text-[#e9edf0]">{metricLabel}</h4>
            <span className="text-[#8fa4ae]">
              {mode === "api" ? "Higher is better" : "Lower is better"}
            </span>
          </div>
          {[
            { name: `Pterodactyl ${ptero.ref}`, color: "bg-[#607480]" },
            {
              name: "Aquadactyl",
              color: "bg-linear-to-r from-[#2e8a80] to-[#9ee7c4]",
            },
          ].map(({ name, color }, index) => (
            <div className="mb-5" key={name}>
              <div className="mb-2 flex justify-between gap-3 text-xs text-[#d5e6e4]">
                <span>{name}</span>
                <span className="shrink-0 font-mono tabular-nums">
                  {format(values[index])}
                </span>
              </div>
              <div
                className="h-8 overflow-hidden rounded-sm bg-[#1a282f]"
                aria-hidden
              >
                <div
                  className={`h-full rounded-sm transition-[width] duration-500 motion-reduce:transition-none ${color}`}
                  style={{ width: `${(values[index] / maximum) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <div className="mt-6 overflow-x-auto border-t border-[#2c3c44] pt-4">
            <table className="w-full text-left text-[11px] leading-relaxed text-[#a5b6c0]">
              <caption className="sr-only">
                Additional measurements for the selected benchmark
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="pb-3 font-normal">
                    Related measurements
                  </th>
                  <th scope="col" className="px-3 pb-3 font-normal">
                    Pterodactyl
                  </th>
                  <th scope="col" className="pb-3 font-normal text-[#b8e6d6]">
                    Aquadactyl
                  </th>
                </tr>
              </thead>
              <tbody>
                {mode === "browser" && (
                  <>
                    <tr>
                      <th scope="row" className="py-1.5 font-normal">
                        Selected timing p95
                      </th>
                      {[ptero, aqua].map((panel, i) => (
                        <td key={i} className="px-3 font-mono">
                          {panel.browser[cache][browserMetric].p95.toFixed(1)}{" "}
                          ms
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row" className="py-1.5 font-normal">
                        Retained JS heap after GC
                      </th>
                      {[ptero, aqua].map((panel, i) => (
                        <td key={i} className="px-3 font-mono">
                          {(
                            panel.browser[cache].heapUsedBytes.median /
                            2 ** 20
                          ).toFixed(1)}{" "}
                          MiB
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row" className="py-1.5 font-normal">
                        Resources transferred, excluding HTML
                      </th>
                      {(["pterodactyl", "aquadactyl"] as const).map(
                        (family) => (
                          <td key={family} className="px-3 font-mono">
                            {(
                              report.browserTransfers[family][cache].median /
                              1024
                            ).toFixed(1)}{" "}
                            KiB
                          </td>
                        ),
                      )}
                    </tr>
                  </>
                )}
                {mode === "api" && (
                  <>
                    <tr>
                      <th scope="row" className="py-1.5 font-normal">
                        Median per-window p95 latency
                      </th>
                      {[ptero, aqua].map((panel, i) => (
                        <td key={i} className="px-3 font-mono">
                          {panel.api[endpoint][
                            concurrency
                          ].p95LatencyMs.median.toFixed(1)}{" "}
                          ms
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row" className="py-1.5 font-normal">
                        Response / validation errors
                      </th>
                      {[ptero, aqua].map((panel, i) => (
                        <td key={i} className="px-3 font-mono">
                          {panel.api[endpoint][concurrency].errors}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
                {mode === "memory" && (
                  <tr>
                    <th scope="row" className="py-1.5 font-normal">
                      Highest sampled working set
                    </th>
                    {[ptero, aqua].map((panel, i) => (
                      <td key={i} className="px-3 font-mono">
                        {(
                          panel.memory[memoryState][memoryScope].max /
                          2 ** 20
                        ).toFixed(1)}{" "}
                        MiB
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-5 text-xs leading-[1.8] text-[#a5b6c0]">{details}</p>
      </div>
      <div className="mt-5 flex flex-col justify-between gap-3 text-[11px] leading-[1.8] text-[#8fa4ae] sm:flex-row sm:gap-8">
        <p className="max-w-185">
          Measured {report.measuredOn} · Chromium {report.environment.browser} ·
          PHP {report.environment.php}. Matched configuration: 2 CPU quota cores
          and 1 GiB per panel. Existing unrelated game containers remained
          running. Local lab results; no WAN or mobile-device measurement.
          Browser heap excludes native and GPU memory.
        </p>
        <Link
          href="/docs/panel/runtime-benchmarks"
          className="inline-flex min-h-10 shrink-0 items-center gap-2 self-start text-xs text-[#b8e6d6] hover:underline"
        >
          Runtime methodology & samples <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
