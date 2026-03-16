/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  reactStrictMode: true,
  distDir: isDev ? ".next-local" : ".next",
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  webpack(config, { dev }) {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
