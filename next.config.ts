import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

// Ensure an absolute path for ESM config files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  // In a workspace with a single root node_modules, point Turbopack
  // to the monorepo root so it can resolve the Next.js package.
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  eslint: {
    // Only run ESLint on these directories during build
    dirs: ['src'],
    // Allow build to succeed even with ESLint warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow build to succeed even with TypeScript errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
