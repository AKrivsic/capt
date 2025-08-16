import Link from "next/link";
import { getAllPosts } from "@/lib/blog/posts";
import t from "@/app/(marketing-shared)/Theme.module.css";

type Props = {
  limit?: number;
  heading?: string;
  ctaLabel?: string;
};

export default function BlogTeaser({
  limit = 3,
  heading = "Latest from the blog",
  ctaLabel = "View all posts",
}: Props) {
  const posts = getAllPosts().slice(0, limit);

  return (
    // ⬇️ Náš lokální theme wrapper – izoluje proměnné jen na tuto sekci
    <section className={t.theme} aria-labelledby="blog-teaser-heading" style={{ padding: "24px 0" }}>
      <div className={t.container}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 id="blog-teaser-heading" className={t.h2} style={{ margin: 0 }}>
            {heading}
          </h2>
          <Link href="/blog" className={`${t.link}`}>
            {ctaLabel} →
          </Link>
        </div>

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
                <Link href={`/blog/${p.slug}`} className={`${t.btn} ${t.btnPrimary}`}>
                  Read more
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
