import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/docs/blueprint",
        destination: "/docs/panel/additional-configuration#blueprint",
        permanent: true,
      },
      {
        source: "/docs/updating",
        destination: "/docs/panel/updating-the-panel",
        permanent: true,
      },
      {
        source: "/docs/getting-started",
        destination: "/docs/panel",
        permanent: true,
      },
      {
        source: "/docs/getting-started/:slug*",
        destination: "/docs/panel/:slug*",
        permanent: true,
      },
      {
        source: "/docs/panel/getting-started",
        destination: "/docs/panel",
        permanent: true,
      },
      {
        source: "/docs/manual-install/:slug*",
        destination: "/docs/panel/:slug*",
        permanent: true,
      },
      // The Wings documentation moved to the Manta section.
      {
        source: "/docs/wings/migrating-to-wings",
        destination: "/docs/manta/installing-manta",
        permanent: true,
      },
      {
        source: "/docs/wings/installing-wings",
        destination: "/docs/manta/installing-manta",
        permanent: true,
      },
      {
        source: "/docs/wings/upgrading-wings",
        destination: "/docs/manta/migrating-from-wings",
        permanent: true,
      },
      {
        source: "/docs/wings/additional-configuration",
        destination: "/docs/manta/additional-configuration",
        permanent: true,
      },
      {
        source: "/docs/wings/benchmarks",
        destination: "/docs/manta/benchmarks",
        permanent: true,
      },
      {
        source: "/docs/wings/:slug*",
        destination: "/docs/manta",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/docs/:slug*.md",
        destination: "/llms.mdx/docs/:slug*/content.md",
      },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
