// src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://captioni.com";

  // Disallow everything on non-production envs (e.g., Vercel preview)
  const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (!isProd) {
    return {
      rules: [{ userAgent: "*", disallow: ["/"] }],
      sitemap: `${site}/sitemap.xml`,
      host: site,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          // interní/technické
          "/admin",
          "/dashboard",
          "/my",
          "/verify-request",
          "/api",
          "/api/auth",
          "/api/webhook",
          "/_next",
          "/static",
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
