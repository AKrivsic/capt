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
  experimental: {
    serverComponentsExternalPackages: [],
    outputFileTracingIncludes: {
      'app/api/video/generate/route.ts': ['node_modules/ffmpeg-static/**'],
      'app/api/demo/video/route.ts': ['node_modules/ffmpeg-static/**'],
      'app/api/demo/preview/[id]/route.ts': ['node_modules/ffmpeg-static/**'],
    },
  } as any,
  // Configure API routes
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
    responseLimit: false,
  },
};

export default nextConfig;
