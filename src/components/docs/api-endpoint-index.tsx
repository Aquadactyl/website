"use client";

import { useState } from "react";
import reference from "../../../public/api/reference.json";

export function ApiEndpointIndex() {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [method, setMethod] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches = reference.operations.filter(
    (operation) =>
      (family === "all" || operation.family === family) &&
      (method === "all" || operation.method === method) &&
      terms.every((term) =>
        `${operation.method} ${operation.path} ${operation.family}`
          .toLowerCase()
          .includes(term),
      ),
  );
  const visible = expanded ? matches : matches.slice(0, 20);
  const fieldClass =
    "min-h-11 w-full rounded-md border border-fd-border bg-fd-background px-3 text-sm text-fd-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-primary";

  return (
    <div className="not-prose border-fd-border bg-fd-card my-6 rounded-xl border p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div>
          <label
            htmlFor="api-search"
            className="mb-1.5 block text-sm font-medium"
          >
            Search endpoints
          </label>
          <input
            id="api-search"
            type="search"
            placeholder="Search paths, e.g. trash or power"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setExpanded(false);
            }}
            className={fieldClass}
          />
        </div>
        <div>
          <label
            htmlFor="api-family"
            className="mb-1.5 block text-sm font-medium"
          >
            API
          </label>
          <select
            id="api-family"
            value={family}
            onChange={(event) => {
              setFamily(event.target.value);
              setExpanded(false);
            }}
            className={fieldClass}
          >
            <option value="all">All APIs</option>
            <option value="client">Client</option>
            <option value="application">Application</option>
            <option value="remote">Wings callbacks</option>
            <option value="blueprint">Blueprint</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="api-method"
            className="mb-1.5 block text-sm font-medium"
          >
            Method
          </label>
          <select
            id="api-method"
            value={method}
            onChange={(event) => {
              setMethod(event.target.value);
              setExpanded(false);
            }}
            className={fieldClass}
          >
            <option value="all">All methods</option>
            {["GET", "POST", "PUT", "PATCH", "DELETE"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-fd-muted-foreground my-3 text-xs" role="status">
        {matches.length} of {reference.routeCount} endpoints
        {visible.length < matches.length
          ? ` · showing first ${visible.length}`
          : ""}
      </p>
      <ul
        className="divide-fd-border divide-y"
        aria-label="Matching API endpoints"
      >
        {visible.map((operation) => (
          <li key={operation.id}>
            <a
              href={`${operation.documentation}#${operation.id}`}
              className="hover:bg-fd-accent focus-visible:outline-fd-primary flex min-h-12 items-start gap-3 rounded py-3 text-sm transition-colors focus-visible:outline-2"
            >
              <span className="border-fd-border text-fd-primary w-14 shrink-0 rounded border px-1 py-0.5 text-center font-mono text-[10px] font-semibold">
                {operation.method}
              </span>
              <code className="min-w-0 text-xs leading-6 break-all">
                {operation.path}
              </code>
            </a>
          </li>
        ))}
      </ul>
      {matches.length === 0 && (
        <p className="text-fd-muted-foreground py-5 text-sm">
          No endpoints match these filters. Try another path or select all APIs
          and methods.
        </p>
      )}
      {visible.length < matches.length && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="border-fd-border hover:bg-fd-accent focus-visible:outline-fd-primary mt-3 min-h-11 rounded-md border px-4 text-sm focus-visible:outline-2"
        >
          Show all {matches.length} matching endpoints
        </button>
      )}
    </div>
  );
}
