import Link from "next/link";
import { Post } from "@/lib/blog/posts";
import t from "@/app/(marketing-shared)/Theme.module.css";

type Props = { post: Post };

export default function BlogCard({ post }: Props) {
  return (
    <article className={t.card}>
      <header>
        <h3 style={{ margin: 0, fontSize: 18 }}>
          <Link href={`/blog/${post.slug}`} className={t.link}>
            {post.title}
          </Link>
        </h3>
        <p className={t.subtle}>
          {new Date(post.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </header>
      <p style={{ marginTop: 8 }}>{post.excerpt}</p>
      <div style={{ marginTop: 12 }}>
        <Link href={`/blog/${post.slug}`} className={`${t.btn} ${t.btnGhost}`}>
          Read more
        </Link>
      </div>
    </article>
  );
}
