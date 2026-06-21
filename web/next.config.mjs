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
};

export default nextConfig;
