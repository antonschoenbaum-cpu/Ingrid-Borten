import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/ingrid-borten", destination: "/om", permanent: true }];
  },
};

export default nextConfig;
