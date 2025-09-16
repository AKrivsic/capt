import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
  // Increase API route body size limit
  outputFileTracingIncludes: {
    'app/api/demo/video/route.ts': [
      'vendor/ffmpeg/**',
      'node_modules/ffmpeg-static/**',
    ],
    'app/api/demo/preview/[id]/route.ts': [
      'vendor/ffmpeg/**',
      'node_modules/ffmpeg-static/**',
    ],
    'app/api/video/generate/route.ts': [
      'vendor/ffmpeg/**',
      'node_modules/ffmpeg-static/**',
    ],
  },
  serverExternalPackages: [],
  // Configure API routes
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
    responseLimit: false,
  },
};

export default nextConfig;
