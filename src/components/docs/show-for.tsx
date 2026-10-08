"use client";

import type { ReactNode } from "react";
import { installPath, useSetup, type WebServer } from "./setup";

const list = <T extends string>(value: T | T[] | undefined): T[] | undefined =>
  value === undefined ? undefined : Array.isArray(value) ? value : [value];

/**
 * Show a part of a page only for readers whose setup matches. Before the
 * reader picks anything, the defaults apply: NGINX, HTTPS and
 * PHP 8.5. Keep headings outside, so the table of contents stays complete.
 */
export function ShowFor({
  webserver,
  ssl,
  children,
}: {
  webserver?: WebServer | WebServer[];
  ssl?: boolean;
  children: ReactNode;
}) {
  const setup = useSetup();

  const matches =
    (list(webserver)?.includes(setup.webserver) ?? true) &&
    (ssl === undefined || ssl === setup.ssl);

  return matches ? <>{children}</> : null;
}

/** Inline text that follows the setup, such as the PHP version in a sentence. */
export function SetupValue({ name }: { name: "domain" | "php" | "path" }) {
  const setup = useSetup();
  if (name === "domain") return <>{setup.domain || "<domain>"}</>;
  if (name === "path") return <>{installPath(setup)}</>;

  return <>{setup.php}</>;
}
