import Link from "next/link";
import { ArrowRight, Gauge } from "lucide-react";
import results from "../../public/benchmarks/optimization-summary.json";

export default function OptimizationResults() {
  return (
    <div
      id="optimization-benchmarks"
      className="mt-10 scroll-mt-24 rounded-xl border border-[#3b6862] bg-[#142826] p-5 sm:p-7"
      aria-labelledby="optimization-heading"
    >
      <p className="mb-3 flex items-center gap-2 text-[11px] tracking-widest text-[#9fc4be] uppercase">
        <Gauge size={14} aria-hidden /> Aquadactyl optimization pass
      </p>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <h3
          id="optimization-heading"
          className="text-[25px] font-medium tracking-[-0.6px] text-[#eff8f5]"
        >
          Measured again. Less waiting.
        </h3>
        <p className="max-w-105 text-xs leading-relaxed text-[#a8babf]">
          The same Aquadactyl base, with a working performance patch. Both
          variants measured together using matching settings and 50 server
          records.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {results.metrics.map((metric) => {
          const change = (metric.after / metric.before - 1) * 100;
          const improved = metric.lowerIsBetter ? change < 0 : change > 0;
          return (
            <div
              key={metric.id}
              className="rounded-lg border border-[#31524e] bg-[#101f21] p-5"
            >
              <p className="mb-4 text-[11px] leading-relaxed text-[#a8c8c0]">
                {metric.label}
              </p>
              <p className="font-mono text-[30px] leading-none tracking-[-1px] text-[#c1fae3]">
                {metric.after.toFixed(1)}
                <span className="ml-1.5 text-sm tracking-normal">
                  {metric.unit}
                </span>
              </p>
              <p className="mt-3 text-[11px] text-[#a5b6c0]">
                Before: {metric.before.toFixed(1)} {metric.unit}
              </p>
              <p
                className={`mt-2 text-xs ${improved ? "text-[#b8e6d6]" : "text-[#e3c699]"}`}
              >
                {Math.abs(change).toFixed(1)}% {change < 0 ? "lower" : "higher"}{" "}
                in this test
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex flex-col justify-between gap-3 text-[11px] leading-[1.8] text-[#9fb7b3] sm:flex-row sm:gap-8">
        <p className="max-w-185">
          Measured {results.measuredOn} · Base{" "}
          {results.baseRevision.slice(0, 12)} + uncommitted patch. Local results
          from repeated browser, API and memory runs. This is a separate
          before/after experiment; the Pterodactyl comparison above retains its
          original source snapshot.
        </p>
        <Link
          href="/docs/panel/optimization-benchmarks"
          className="inline-flex min-h-10 shrink-0 items-center gap-2 self-start text-xs text-[#b8e6d6] hover:underline"
        >
          Changes, results & raw data <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
