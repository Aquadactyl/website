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
    <section className="not-prose space-y-6">
      <div className="bg-fd-card rounded-xl border p-4 sm:p-5">
        <label
          htmlFor="blueprint-source"
          className="text-fd-foreground mb-2 flex items-center gap-2 text-sm font-medium"
        >
          <FileCode2 className="text-fd-primary size-4" />
          Paste a manifest, install script, or frontend file
        </label>
        <textarea
          id="blueprint-source"
          value={source}
          onChange={(event) => setSource(event.currentTarget.value)}
          placeholder={
            'yarn install\\nimport { Link } from "react-router-dom";'
          }
          className="bg-fd-secondary focus-visible:ring-fd-ring placeholder:text-fd-muted-foreground min-h-52 w-full resize-y rounded-lg border p-3 font-mono text-xs leading-relaxed outline-none focus-visible:ring-2"
          spellCheck={false}
        />
        <p className="text-fd-muted-foreground mt-2 text-xs">
          Analysis happens locally in this tab. Nothing is sent to Aquadactyl.
        </p>
      </div>

      {source && (
        <>
          <div className="bg-fd-card rounded-xl border p-4 sm:p-5">
            <h2 className="text-fd-foreground mb-3 flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="text-fd-primary size-4" />
              Review {result.matches.length} finding
              {result.matches.length === 1 ? "" : "s"}
            </h2>
            {result.matches.length > 0 ? (
              <ul className="space-y-3">
                {result.matches.map((finding) => (
                  <li
                    key={finding.label}
                    className="text-fd-muted-foreground text-sm"
                  >
                    <strong className="text-fd-foreground">
                      {finding.label}:
                    </strong>{" "}
                    {finding.detail}
                    {finding.replacement && (
                      <span className="text-fd-primary ml-1 font-mono">
                        Safe replacement: {finding.replacement}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-fd-muted-foreground text-sm">
                No common patterns were detected. Continue with the manual
                checklist.
              </p>
            )}
          </div>

          <div className="bg-fd-card overflow-hidden rounded-xl border">
            <div className="bg-fd-secondary flex items-center justify-between gap-3 border-b px-4 py-3">
              <h2 className="text-fd-foreground flex items-center gap-2 text-sm font-semibold">
                <WandSparkles className="text-fd-primary size-4" />
                Safe replacements
              </h2>
              <button
                type="button"
                onClick={copy}
                className="text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="fd-scroll-container max-h-100 overflow-auto p-4 font-mono text-xs leading-relaxed">
              <code>{result.migrated}</code>
            </pre>
          </div>
        </>
      )}
    </section>
  );
}
