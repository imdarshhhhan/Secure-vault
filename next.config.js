/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces plain static HTML/JS/CSS in ./out — no Node server needed at runtime.
  // scripts/build-extension.mjs then turns ./out into a Chrome-ready ./extension-dist.
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
};

module.exports = nextConfig;
