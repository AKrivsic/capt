// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { getAllSlugs, getPostBySlug } from "@/lib/blog/posts";

type BlogPostMeta = {
  date?: string | Date;
  updated?: string | Date;
  updatedAt?: string | Date;
  publishedAt?: string | Date;
};

function toDate(input: string | Date | undefined): Date | undefined {
  if (!input) return undefined;
  if (input instanceof Date) return input;
  const d = new Date(input);
  return isNaN(d.getTime()) ? undefined : d;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://captioni.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/instagram-captions`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/tiktok-captions`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/onlyfans-bio-ideas`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];

  const blogPosts: MetadataRoute.Sitemap = getAllSlugs().map((slug) => {
    const post = getPostBySlug(slug) as BlogPostMeta | undefined;

    const lastModified =
      toDate(post?.updated) ??
      toDate(post?.updatedAt) ??
      toDate(post?.publishedAt) ??
      toDate(post?.date) ??
      new Date();

    return {
      url: `${base}/blog/${slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    };
  });

  return [...staticPages, ...blogPosts];
}
