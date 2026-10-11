import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlueprintMigrationAssistant from "@/components/BlueprintMigrationAssistant";

export const metadata = {
  title: "Blueprint migration assistant — Aquadactyl",
  description:
    "Check common Pterodactyl Blueprint extension incompatibilities before migrating to Aquadactyl.",
};

export default function BlueprintMigratorPage() {
  return (
    <div className="bg-[#11161b] text-[#e9edf0]">
      <Header />
      <main className="mx-auto w-full max-w-220 flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <Link
          href="/docs/blueprint/migration"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#8c9aa7] hover:text-[#e9edf0]"
        >
          <ArrowLeft size={15} />
          Back to migration guide
        </Link>
        <p className="mb-3 text-sm font-medium text-[#78d4cc]">
          Blueprint tools
        </p>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Migration assistant
        </h1>
        <p className="mb-8 max-w-170 text-base leading-7 text-[#a0abb6]">
          Find common Pterodactyl Blueprint patterns that need review for
          Aquadactyl. Only Yarn and React Router DOM replacements are automated.
        </p>
        <BlueprintMigrationAssistant />
      </main>
      <Footer />
    </div>
  );
}
