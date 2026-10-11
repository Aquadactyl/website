"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  FileCode2,
  WandSparkles,
} from "lucide-react";

type Finding = {
  label: string;
  detail: string;
  replacement?: string;
  pattern: RegExp;
};

const findings: Finding[] = [
  {
    label: "Yarn command",
    detail: "Use the panel's pinned pnpm toolchain instead of Yarn.",
    replacement: "pnpm",
    pattern: /\byarn(?:pkg)?\b/gi,
  },
  {
    label: "React Router DOM",
    detail: "Aquadactyl uses React Router 8 from the react-router package.",
    replacement: "react-router",
    pattern: /react-router-dom/g,
  },
  {
    label: "Easy Peasy",
    detail: "Move state access to the panel's Zustand store helpers.",
    pattern: /easy-peasy|useStoreState|useStoreActions/gi,
  },
  {
    label: "Legacy frontend dependency",
    detail: "Review this dependency and prefer the panel's shared runtime.",
    pattern: /\b(?:styled-components|twin\.macro|swr)\b/gi,
  },
  {
    label: "Blueprint self-upgrade",
    detail: "Aquadactyl updates the panel and bundled framework together.",
    pattern: /blueprint\s+-upgrade/gi,
  },
];

function migrate(source: string) {
  return source
    .replace(/\byarnpkg\b/gi, "pnpm")
    .replace(/\byarn\b/gi, "pnpm")
    .replace(/react-router-dom/g, "react-router");
}

export default function BlueprintMigrationAssistant() {
  const [source, setSource] = useState("");
  const [copied, setCopied] = useState(false);
  const result = useMemo(() => {
    const matches = findings.filter((finding) => finding.pattern.test(source));
    findings.forEach((finding) => (finding.pattern.lastIndex = 0));
    return { matches, migrated: migrate(source) };
  }, [source]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(result.migrated);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="not-prose space-y-5">
      <div className="rounded-lg border border-[#303b45] bg-[#172027] p-4 sm:p-5">
        <label
          htmlFor="blueprint-source"
          className="mb-2 flex items-center gap-2 text-sm font-medium text-[#e9edf0]"
        >
          <FileCode2 size={16} className="text-[#78d4cc]" />
          Paste a manifest, install script, or frontend file
        </label>
        <textarea
          id="blueprint-source"
          value={source}
          onChange={(event) => setSource(event.currentTarget.value)}
          placeholder={
            'yarn install\\nimport { Link } from "react-router-dom";'
          }
          className="min-h-52 w-full resize-y rounded-md border border-[#3d4a56] bg-[#0d1217] p-3 font-mono text-xs leading-relaxed text-[#d7dce1] outline-none placeholder:text-[#687887] focus:border-[#78d4cc] focus:ring-1 focus:ring-[#78d4cc]"
          spellCheck={false}
        />
        <p className="mt-2 text-xs text-[#8c9aa7]">
          Analysis happens locally in this tab. Nothing is sent to Aquadactyl.
        </p>
      </div>

      {source && (
        <>
          <div className="rounded-lg border border-[#303b45] bg-[#172027] p-4 sm:p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[#e9edf0]">
              <AlertTriangle size={17} className="text-[#e8c38b]" />
              Review {result.matches.length} finding
              {result.matches.length === 1 ? "" : "s"}
            </h2>
            {result.matches.length > 0 ? (
              <ul className="space-y-3">
                {result.matches.map((finding) => (
                  <li key={finding.label} className="text-sm text-[#bbc5ce]">
                    <strong className="text-[#e9edf0]">{finding.label}:</strong>{" "}
                    {finding.detail}
                    {finding.replacement && (
                      <span className="ml-1 font-mono text-[#78d4cc]">
                        Safe replacement: {finding.replacement}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#bbc5ce]">
                No common patterns were detected. Continue with the manual
                checklist.
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-[#303b45] bg-[#0d1217]">
            <div className="flex items-center justify-between gap-3 border-b border-[#303b45] bg-[#202a33] px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[#e9edf0]">
                <WandSparkles size={16} className="text-[#78d4cc]" />
                Safe replacements
              </h2>
              <button
                type="button"
                onClick={copy}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[#bbc5ce] hover:bg-[#303b45] hover:text-white"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="max-h-100 overflow-auto p-4 text-xs leading-relaxed text-[#d7dce1]">
              <code>{result.migrated}</code>
            </pre>
          </div>
        </>
      )}
    </section>
  );
}
