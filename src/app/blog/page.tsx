import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog/posts";
import t from "../(marketing-shared)/Theme.module.css";

export const metadata: Metadata = {
  title: "Blog – Captioni",
  description:
    "Guides, tips, and strategies for writing captions, bios, and hashtags that convert.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className={`${t.container} ${t.theme}`}>
      <header style={{ marginBottom: 24 }}>
        <h1 className={t.h1}>Blog</h1>
        <p className={t.subtle}>
          Actionable advice for Instagram, TikTok, and OnlyFans creators.
        </p>
      </header>

      <div className={t.grid}>
        {posts.map((p) => (
          <article key={p.slug} className={t.card}>
            <header>
              <h3 style={{ margin: 0, fontSize: 18 }}>
                <Link href={`/blog/${p.slug}`} className={t.link}>
                  {p.title}
                </Link>
              </h3>
              <p className={t.subtle}>
                {new Date(p.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </header>

            <p style={{ marginTop: 8 }}>{p.excerpt}</p>

            <div style={{ marginTop: 12 }}>
              <Link
                href={`/blog/${p.slug}`}
                className={`${t.btn} ${t.btnGhost}`}
              >
                Read more
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
