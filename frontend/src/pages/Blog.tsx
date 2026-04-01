import { useEffect, useMemo, useState } from "react";
import ContentPageLayout from "@/components/ContentPageLayout";
import { type BlogPost, loadBlogPosts } from "@/lib/blog";

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const loaded = await loadBlogPosts();
        if (!cancelled) {
          setPosts(loaded);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Could not load blog content.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasPosts = useMemo(() => posts.length > 0, [posts.length]);

  return (
    <ContentPageLayout
      title="Blog"
      subtitle="Updates and articles from your /public/blog folder. Click a card to read the full post."
    >
      {loading ? (
        <div className="max-w-3xl border border-border bg-background p-6 md:p-8">
          <p className="text-sm text-muted-foreground font-light">Loading blog content...</p>
        </div>
      ) : null}

      {error ? (
        <div className="max-w-3xl border border-border bg-background p-6 md:p-8 space-y-3">
          <h2 className="font-heading text-3xl text-foreground">Could not load blog posts</h2>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">{error}</p>
        </div>
      ) : null}

      {!loading && !error && !hasPosts ? (
        <div className="max-w-3xl border border-border bg-background p-6 md:p-8 space-y-3">
          <h2 className="font-heading text-3xl text-foreground">No blog posts found</h2>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            Add markdown files in <code className="rounded bg-secondary px-2 py-0.5 text-foreground">/public/blog-content</code> and list
            them in <code className="rounded bg-secondary px-2 py-0.5 text-foreground">/public/blog-content/index.json</code>.
          </p>
        </div>
      ) : null}

      {!loading && !error && hasPosts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <article key={post.file} className="border border-border bg-background p-6 md:p-8 space-y-4">
              <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                {post.publishedAt || "Undated"}
              </p>
              <h2 className="font-heading text-3xl leading-tight text-foreground">{post.title}</h2>
              {post.excerpt ? (
                <p className="text-sm text-muted-foreground font-light leading-relaxed">{post.excerpt}</p>
              ) : null}
              <a
                href={`/blog/${post.slug}`}
                className="inline-flex items-center text-sm border border-border px-4 py-2 text-foreground hover:border-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                Read more
              </a>
            </article>
          ))}
        </div>
      ) : null}
    </ContentPageLayout>
  );
};

export default Blog;
