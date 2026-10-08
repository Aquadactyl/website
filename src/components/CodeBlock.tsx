"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

export default function CodeBlock({
  code,
  title = "Terminal",
}: {
  code: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCopied(false);
    setError(false);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [code]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setError(false);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(true);
    }
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-[7px] border border-[#303b45] bg-[#0d1217]">
      <div className="flex items-center justify-between gap-3 border-b border-[#303b45] bg-[#202a33] px-3 py-2.5 text-[11px] text-[#bbc5ce] sm:px-3.75 sm:py-2.75 sm:text-xs">
        <span className="flex min-w-0 items-center gap-2 font-medium">
          <Terminal className="text-[#8c9aa7]" size={14} />
          {title}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex shrink-0 items-center gap-1.5 rounded-sm p-1.5 text-xs text-[#a0abb6] transition-colors hover:bg-[#303b45] hover:text-[#e9edf0]"
          aria-label={`Copy ${title.toLowerCase()} commands`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="m-0 scrollbar-thin [scrollbar-color:#52616f_transparent] overflow-x-auto p-3.5 sm:p-4.5 md:p-5">
        <code className="block bg-transparent p-0 font-mono text-[11px] leading-loose text-[#d7dce1] sm:text-xs">
          {code}
        </code>
      </pre>
      {error && (
        <p className="px-4.25 pb-3.5 text-xs text-[#e8c38b]" role="status">
          Select and copy the commands above; clipboard access is unavailable.
        </p>
      )}
    </div>
  );
}
