import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import { DocsLayout } from "@/components/ai/layout";
import { source } from "@/lib/source";
import BlueprintMigrationAssistant from "@/components/BlueprintMigrationAssistant";

export const metadata = {
  title: "Blueprint migration assistant — Aquadactyl",
  description:
    "Check common Pterodactyl Blueprint extension incompatibilities before migrating to Aquadactyl.",
};

export default function BlueprintMigratorPage() {
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
        { text: "Overview", url: "/" },
        { text: "Features", url: "/#features" },
        { text: "Extensions", url: "/#blueprint" },
        {
          text: "GitHub",
          url: "https://github.com/Aquadactyl/aquadactyl",
          external: true,
        },
      ]}
    >
      <DocsPage>
        <Link
          href="/docs/blueprint/migration"
          className="text-fd-muted-foreground hover:text-fd-foreground mb-6 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to migration guide
        </Link>
        <DocsTitle>Blueprint migration assistant</DocsTitle>
        <DocsDescription>
          Find common Pterodactyl Blueprint patterns that need review for
          Aquadactyl. Only Yarn and React Router DOM replacements are automated.
        </DocsDescription>
        <DocsBody>
          <BlueprintMigrationAssistant />
        </DocsBody>
      </DocsPage>
    </DocsLayout>
  );
}
