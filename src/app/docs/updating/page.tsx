import type { Metadata } from "next";
import Documentation from "@/Documentation";

export const metadata: Metadata = {
  title: "Update your panel — Aquadactyl documentation",
};

export default function DocsUpdatingPage() {
  return <Documentation page="updating" />;
}
