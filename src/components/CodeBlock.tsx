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
    <div className="code-block">
      <div className="code-heading">
        <span>
          <Terminal className="terminal-symbol" size={14} />
          {title}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${title.toLowerCase()} commands`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
      {error && (
        <p className="copy-error" role="status">
          Select and copy the commands above; clipboard access is unavailable.
        </p>
      )}
    </div>
  );
}
