import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";
import type { ReactNode } from "react";
import { COMMUNITY, REPOSITORY } from "@/config";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: (
          <span className="flex items-center gap-2 font-semibold">
            <img
              src="/brand/aquadactyl-emblem.png"
              alt="Aquadactyl"
              width={24}
              height={24}
              className="rounded object-contain"
            />
            <span>Aquadactyl</span>
          </span>
        ),
        url: "/",
      }}
      links={[
        {
          text: "Overview",
          url: "/",
        },
        {
          text: "Features",
          url: "/#features",
        },
        {
          text: "Extensions",
          url: "/#blueprint",
        },
        {
          text: "Discord",
          url: COMMUNITY,
          external: true,
        },
        {
          text: "GitHub",
          url: REPOSITORY,
          external: true,
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
