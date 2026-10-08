import type { Metadata } from "next";
import Documentation from "@/Documentation";

export const metadata: Metadata = {
  title: "Blueprint integration — Aquadactyl documentation",
};

export default function DocsBlueprintPage() {
  return <Documentation page="blueprint" />;
}
