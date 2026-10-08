import type { Metadata } from "next";
import Documentation from "@/Documentation";

export const metadata: Metadata = {
  title: "Install Aquadactyl — Aquadactyl documentation",
};

export default function DocsInstallationPage() {
  return <Documentation page="installation" />;
}
