// src/app/blog/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSlugs, getPostBySlug } from "@/lib/blog/posts";
import t from "../../(marketing-shared)/Theme.module.css";
import type { ReactElement } from "react";

type PageParams = { slug: string };
type PageProps = { params: Promise<PageParams> };

export function generateStaticParams(): PageParams[] {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const post = getPostBySlug(slug);
  if (!post) {
    return {
      title: "Post not found – Blog – Captioni",
      description: "The post you are looking for does not exist.",
      alternates: { canonical: `/blog/${slug}` },
    };
  }

  const title = `${post.title} – Blog – Captioni`;
  const description = post.excerpt ?? "";

  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://captioni.com/blog/${slug}`,
      type: "article",
    },
    twitter: { title, description, card: "summary_large_image" },
  };
}

// lightweight renderer: H2 přes "## ", číslované/odrážkové seznamy, prázdné řádky
function renderContent(raw: string): ReactElement[] {
  const lines = raw.trim().split("\n");
  const nodes: ReactElement[] = [];
  let list: string[] = [];
  let ordered = false;

  const flush = () => {
    if (list.length === 0) return;
    if (ordered) {
      nodes.push(
        <ol key={`ol-${nodes.length}`} className={t.ol}>
          {list.map((l, i) => (
            <li key={i}>{l.replace(/^\d+\.\s*/, "")}</li>
          ))}
        </ol>
      );
    } else {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className={t.ul}>
          {list.map((l, i) => (
            <li key={i}>{l.replace(/^-\s*/, "")}</li>
          ))}
        </ul>
      );
    }
    list = [];
    ordered = false;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      flush();
      nodes.push(
        <h2 key={`h2-${idx}`} className={t.h2}>
          {trimmed.replace(/^## /, "")}
        </h2>
      );
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (!ordered) {
        flush();
        ordered = true;
      }
      list.push(trimmed);
      return;
    }

    if (/^-\s+/.test(trimmed)) {
      if (ordered) flush();
      list.push(trimmed);
      return;
    }

    if (trimmed === "") {
      return; // odstavec break
    }

    flush();
    nodes.push(<p key={`p-${idx}`}>{trimmed}</p>);
  });

  flush();
  return nodes;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return notFound();

  const published = new Date(post.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className={`${t.container} ${t.theme}`}>
      <nav style={{ marginBottom: 12 }}>
        <Link href="/" className={t.link}>
          ← Back to home
        </Link>
      </nav>

      <header style={{ marginBottom: 8 }}>
        <h1 className={t.h1}>{post.title}</h1>
        <p className={t.subtle}>
          {published} · {post.tags.join(" · ")}
        </p>
      </header>

      <article>{renderContent(post.content)}</article>

      <footer style={{ marginTop: 28, borderTop: "1px solid #eee", paddingTop: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
  href="/?demo=true"
  data-pt-event="Demo click"
  data-pt-props='{"source":"blog"}'
>
  Try free demo
</Link>
          <Link href="/#pricing" className={`${t.btn} ${t.btnGhost} ${t.btnLg}`}>
            See pricing
          </Link>
        </div>
      </footer>
    </main>
  );
}
