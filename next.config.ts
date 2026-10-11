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
      {
        source: "/docs/wings/migrating-to-wings",
        destination: "/docs/wings/installing-wings",
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
