import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/docs/blueprint",
        destination: "/docs/manual-install/additional-configuration#blueprint",
        permanent: true,
      },
      {
        source: "/docs/updating",
        destination: "/docs/manual-install/updating-the-panel",
        permanent: true,
      },
      {
        source: "/docs/panel/getting-started",
        destination: "/docs/getting-started",
        permanent: true,
      },
      {
        source: "/docs/panel/:slug*",
        destination: "/docs/manual-install/:slug*",
        permanent: true,
      },
      {
        source: "/docs/wings/migrating-to-wings",
        destination: "/docs/wings/installing-wings",
        permanent: true,
      },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
