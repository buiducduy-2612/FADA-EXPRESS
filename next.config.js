/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  allowedDevOrigins: ['*.replit.dev', '*.sisko.replit.dev'],
  serverExternalPackages: [],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@prisma/client'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: true,
  },
};

module.exports = nextConfig;
