import type { NextConfig } from 'next';

// Static export: `npm run build` writes plain files to out/, deployable on any free host.
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: { root: process.cwd() },
  devIndicators: false,
};

export default config;
