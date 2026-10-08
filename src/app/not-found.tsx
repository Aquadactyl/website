import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "This page isn’t here — Aquadactyl",
};

export default function NotFound() {
  return (
    <main className="not-found container">
      <h1>This page isn’t here.</h1>
      <p>Use the project home or documentation to find what you need.</p>
      <Link href="/" className="button button-accent">
        Back to Aquadactyl <ArrowRight size={16} />
      </Link>
    </main>
  );
}
