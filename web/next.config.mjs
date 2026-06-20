/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for catching issues early
  reactStrictMode: true,
  // Expose API base URL to client
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  },
};

export default nextConfig;
