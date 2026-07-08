/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for catching issues early
  reactStrictMode: true,
  // @miethe/ui ships ESM source with 'use client' directives that must be
  // compiled by Next's bundler rather than treated as an external package.
  transpilePackages: ["@miethe/ui"],
  // Expose API base URL to client
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  },
  // P6 (F-002): allows a second, explicitly-flagged production build (the
  // Playwright "flags-on" project) to live in its own output dir so it can
  // coexist with the default `.next` build used by the legacy e2e project.
  // No-op (defaults to ".next") unless NEXT_DIST_DIR is set.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
