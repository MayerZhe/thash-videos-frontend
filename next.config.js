/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Cloudflare Pages. All pages are client-rendered
  // and call https://api.videos.thash.app for backend data.
  output: 'export',
};

module.exports = nextConfig;
