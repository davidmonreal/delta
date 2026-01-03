import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    E2E_AUTH_BYPASS: process.env.E2E_AUTH_BYPASS,
  },
};

export default nextConfig;
