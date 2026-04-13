import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";
const isVercel = process.env.VERCEL === "1";
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  distDir: isDev || isVercel ? ".next" : ".next-prod",
  outputFileTracingRoot: projectRoot,
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  webpack(config, { dev }) {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
