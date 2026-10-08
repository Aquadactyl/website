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
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
