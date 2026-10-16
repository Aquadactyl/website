"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FlaskConical } from "lucide-react";
import results from "../../public/benchmarks/comparison-summary.json";

type Comparison = keyof typeof results.comparisons;
const number = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
const formatValue = (value: number, unit: string) =>
  unit === "req/s" && value >= 1000
    ? `${(value / 1000).toFixed(1)}k`
    : number.format(value);

export default function BenchmarkComparison() {
  const [selected, setSelected] = useState<Comparison>("panel");
  const comparison = results.comparisons[selected];

  return (
    <section
      id="benchmarks"
      aria-labelledby="benchmark-heading"
      className="border-y border-[#303b45] bg-[#131c21] py-10 sm:py-12"
    >
      <div className="mx-auto w-full max-w-296 px-5 sm:px-6 md:px-8">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[11px] tracking-widest text-[#9fc4be] uppercase">
              <FlaskConical size={13} aria-hidden /> Tested side by side
            </p>
            <h2
              id="benchmark-heading"
              className="text-[27px] font-medium tracking-tight text-[#e9edf0]"
            >
              Benchmarks
            </h2>
          </div>
          <div
            role="group"
            aria-label="Benchmark comparison"
            className="flex w-fit max-w-full gap-1 rounded-lg border border-[#303b45] bg-[#10171c] p-1"
          >
            {Object.entries(results.comparisons).map(([id, item]) => (
              <button
                key={id}
                type="button"
                aria-pressed={selected === id}
                aria-controls="benchmark-results"
                onClick={() => setSelected(id as Comparison)}
                className={`rounded-md px-2.5 py-2 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a4e3dc] sm:px-4 sm:text-xs ${selected === id ? "bg-[#25403e] text-[#b8eee7]" : "text-[#a0abb6] hover:text-white"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div
          id="benchmark-results"
          className="overflow-hidden rounded-lg border border-[#303b45] bg-[#182128]"
        >
          <table className="w-full table-fixed text-left">
            <caption className="sr-only">
              {comparison.label}: measured values. {comparison.description}
            </caption>
            <thead className="border-b border-[#303b45] bg-[#1c272e] text-[11px] text-[#a0abb6] sm:text-xs">
              <tr>
                <th
                  scope="col"
                  className="w-[44%] px-3 py-3 font-normal sm:w-1/2 sm:px-5"
                >
                  Measurement
                </th>
                <th scope="col" className="px-1 py-3 font-medium sm:px-4">
                  {comparison.baseline}
                </th>
                <th
                  scope="col"
                  className="px-1 py-3 font-medium text-[#a4e3dc] sm:px-4"
                >
                  {comparison.candidate}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.metrics.map((metric) => {
                const change = (metric.candidate / metric.baseline - 1) * 100;
                const improved =
                  metric.better === "higher" ? change > 0 : change < 0;
                const maximum = Math.max(metric.baseline, metric.candidate);
                return (
                  <tr
                    key={metric.id}
                    className="border-b border-[#303b45] last:border-0"
                  >
                    <th scope="row" className="px-3 py-3 font-normal sm:px-5">
                      <span className="block text-xs font-medium text-[#e9edf0] sm:text-sm">
                        {metric.label}
                      </span>
                      <span className="mt-1 block text-[10px] leading-relaxed text-[#a0abb6] sm:text-[11px]">
                        {metric.context}
                      </span>
                    </th>
                    {(["baseline", "candidate"] as const).map((variant) => (
                      <td key={variant} className="px-1 py-3 sm:px-4">
                        <span
                          title={`${number.format(metric[variant])} ${metric.unit}`}
                          className={`block text-base leading-tight font-medium tabular-nums sm:text-xl ${variant === "candidate" ? "text-[#b8eee7]" : "text-[#e9edf0]"}`}
                        >
                          {formatValue(metric[variant], metric.unit)}
                          <span
                            className={`text-[10px] font-normal text-[#a0abb6] sm:text-[11px] ${metric.unit === "req/s" && metric[variant] >= 1000 ? "mt-0.5 block sm:mt-0 sm:ml-1 sm:inline" : "ml-1"}`}
                          >
                            {metric.unit}
                          </span>
                        </span>
                        <div
                          aria-hidden
                          className="mt-2 mr-3 h-1 rounded-full bg-[#29343c]"
                        >
                          <div
                            className={`h-full rounded-full ${variant === "candidate" ? "bg-[#75c7ba]" : "bg-[#72818e]"}`}
                            style={{
                              width: `${(metric[variant] / maximum) * 100}%`,
                            }}
                          />
                        </div>
                        {variant === "candidate" && (
                          <span
                            className={`mt-1 block text-[10px] tabular-nums ${improved ? "text-[#a4e3dc]" : "text-[#d8bc90]"}`}
                          >
                            {Math.abs(change).toFixed(1)}%{" "}
                            {change < 0 ? "less" : "more"} {metric.changeLabel}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-col justify-between gap-2 text-[11px] leading-relaxed text-[#a0abb6] sm:flex-row sm:items-center">
          <p>
            {comparison.description} Local lab · {results.measuredOn}. Results
            vary by workload.
          </p>
          <Link
            href={comparison.href}
            className="inline-flex shrink-0 items-center gap-1 text-[#a4e3dc] hover:text-white"
          >
            Full results &amp; methodology{" "}
            <ArrowUpRight size={13} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
