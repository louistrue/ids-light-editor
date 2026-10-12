/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep the Node auditor native: its model parsers include browser-only WASM assets.
    serverComponentsExternalPackages: ["@ifc-lite/ids"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
