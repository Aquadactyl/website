import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "This page isn’t here — Aquadactyl",
};

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-296 px-5 py-17.5 pb-25 sm:px-6 md:px-8 md:py-27.5 md:pb-37.5">
      <h1 className="mb-4.5 text-[32px] font-medium tracking-[-0.6px] text-[#e9edf0] md:text-[40px]">
        This page isn’t here.
      </h1>
      <p className="mb-7 leading-[1.85] text-[#a0abb6]">
        Use the project home or documentation to find what you need.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11.5 items-center justify-center gap-2.5 rounded-md border border-[#2b7c80] bg-[#20696d] px-5 text-sm font-medium text-[#effcfa] transition-colors duration-150 hover:border-[#55c0b7] hover:bg-[#237c7f]"
      >
        Back to Aquadactyl <ArrowRight size={16} />
      </Link>
    </main>
  );
}
