"use client";

import type { ReactNode } from "react";
import {
  Code,
  Folder,
  Globe,
  Link,
  Lock,
  LockOpen,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import {
  DEFAULT_PATH,
  PHP_VERSIONS,
  resetSetup,
  updateSetup,
  useSetup,
  type Setup,
  type WebServer,
} from "./setup";
import { Button, Segmented, TextField, Widget } from "./widget";

type Field = "domain" | "webserver" | "ssl" | "php" | "path";

const ALL_FIELDS: Field[] = ["php", "webserver", "ssl", "domain", "path"];

/** One setting: its name on the left, its control on the right (stacked on narrow screens). */
function Row({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center sm:gap-4">
      <span className="text-fd-muted-foreground flex items-center gap-2 text-xs font-medium">
        <Icon
          aria-hidden
          className="text-fd-muted-foreground/70 size-4 shrink-0"
          strokeWidth={1.75}
        />
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {children}
      </div>
    </div>
  );
}

/**
 * Where the reader enters their installation once. Every code block on the
 * site fills in these values, and <ShowFor /> sections switch to match.
 */
export function SetupPanel({
  fields = ["php", "webserver", "ssl", "domain"],
}: {
  fields?: Field[];
}) {
  const setup = useSetup();
  const set = (patch: Partial<Setup>) => updateSetup(patch);

  // Keep the canonical order, whatever order the page lists the fields in.
  const rows = ALL_FIELDS.filter((field) => fields.includes(field));

  return (
    <Widget
      title="Your setup"
      description="Commands and configuration files on this site update to match. Saved in this browser only."
      actions={
        <Button onClick={resetSetup}>
          <span className="flex items-center gap-1.5">
            <RotateCcw aria-hidden className="size-3.5" strokeWidth={1.75} />
            Reset
          </span>
        </Button>
      }
    >
      <div className="divide-fd-border/50 divide-y">
        {rows.map((field) => {
          switch (field) {
            case "php":
              return (
                <Row key={field} label="PHP" icon={Code}>
                  <Segmented
                    label="PHP version"
                    value={setup.php}
                    onChange={(php) => set({ php })}
                    options={PHP_VERSIONS.map((v) => ({ value: v, label: v }))}
                  />
                </Row>
              );
            case "webserver":
              return (
                <Row key={field} label="Web server" icon={Globe}>
                  <Segmented<WebServer>
                    label="Web server"
                    value={setup.webserver}
                    onChange={(webserver) => set({ webserver })}
                    options={[
                      { value: "nginx", label: "NGINX" },
                      { value: "apache", label: "Apache" },
                      { value: "caddy", label: "Caddy" },
                    ]}
                  />
                </Row>
              );
            case "ssl":
              return (
                <Row key={field} label="SSL" icon={Lock}>
                  <Segmented
                    label="SSL"
                    value={setup.ssl ? "on" : "off"}
                    onChange={(value) => set({ ssl: value === "on" })}
                    options={[
                      {
                        value: "on",
                        label: (
                          <span className="flex items-center gap-1.5">
                            <Lock
                              aria-hidden
                              className="size-3.5"
                              strokeWidth={1.75}
                            />
                            HTTPS
                          </span>
                        ),
                      },
                      {
                        value: "off",
                        label: (
                          <span className="flex items-center gap-1.5">
                            <LockOpen
                              aria-hidden
                              className="size-3.5"
                              strokeWidth={1.75}
                            />
                            HTTP only
                          </span>
                        ),
                      },
                    ]}
                  />
                </Row>
              );
            case "domain":
              return (
                <Row key={field} label="Panel domain" icon={Link}>
                  <TextField
                    aria-label="Panel domain"
                    placeholder="panel.example.com"
                    value={setup.domain}
                    onChange={(event) => set({ domain: event.target.value })}
                    className="max-w-sm"
                  />
                </Row>
              );
            case "path":
              return (
                <Row key={field} label="Install directory" icon={Folder}>
                  <TextField
                    aria-label="Install directory"
                    placeholder={DEFAULT_PATH}
                    value={setup.path}
                    onChange={(event) => set({ path: event.target.value })}
                    className="max-w-sm"
                  />
                </Row>
              );
          }
        })}
      </div>
    </Widget>
  );
}
