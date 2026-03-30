import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { type BlogPost, loadBlogPostBySlug, markdownToBlocks } from "@/lib/blog";

const BlogPostPage = () => {
  const { slug = "" } = useParams<{ slug: string }>();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const loaded = await loadBlogPostBySlug(slug);
        if (!cancelled) {
          setPost(loaded);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Could not load blog post.");
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
  }, [slug]);

  const blocks = post ? markdownToBlocks(post.body) : [];
  const contentBlocks = blocks.filter((block, index) => !(index === 0 && block.type === "h1"));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="pt-28 pb-24">
        <article className="mx-auto w-full max-w-3xl px-6 md:px-10">
          {loading ? <p className="text-sm text-muted-foreground font-light">Loading post...</p> : null}

          {error ? (
            <div className="space-y-3 border border-border bg-background p-8 md:p-10">
              <h1 className="font-heading text-4xl md:text-5xl text-foreground">Could not load this post</h1>
              <p className="text-sm text-muted-foreground font-light leading-relaxed">{error}</p>
            </div>
          ) : null}

          {!loading && !error && !post ? (
            <div className="space-y-3 border border-border bg-background p-8 md:p-10">
              <h1 className="font-heading text-4xl md:text-5xl text-foreground">Post not found</h1>
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                This post is missing or could not be loaded. It may have been removed or the URL may be incorrect.
              </p>
            </div>
          ) : null}

          {!loading && !error && post ? (
            <>
              <header className="space-y-4 pb-8 border-b border-border text-center">
                <a
                  href="/blog"
                  className="inline-flex items-center text-xs uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Blog
                </a>
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                  {post.publishedAt || "Undated"} {post.author ? `· ${post.author}` : ""}
                </p>
                <h1 className="font-heading text-4xl md:text-5xl leading-[1.1] text-foreground">
                  {post.title}
                </h1>
                {post.excerpt ? (
                  <p className="mx-auto max-w-2xl text-base md:text-lg text-muted-foreground font-light leading-relaxed">
                    {post.excerpt}
                  </p>
                ) : null}
              </header>

              <section className="mx-auto max-w-2xl pt-8 md:pt-10 space-y-5 md:space-y-6">
                {contentBlocks.map((block, index) => {
                  if (block.type === "h1") {
                    return (
                      <h2 key={`${post.file}-h1-${index}`} className="font-heading text-3xl leading-tight text-foreground pt-1">
                        {block.text}
                      </h2>
                    );
                  }

                  if (block.type === "h2") {
                    return (
                      <h2 key={`${post.file}-h2-${index}`} className="font-heading text-3xl leading-tight text-foreground pt-3">
                        {block.text}
                      </h2>
                    );
                  }

                  if (block.type === "h3") {
                    return (
                      <h3 key={`${post.file}-h3-${index}`} className="font-heading text-2xl leading-tight text-foreground pt-2">
                        {block.text}
                      </h3>
                    );
                  }

                  if (block.type === "ul") {
                    return (
                      <ul key={`${post.file}-ul-${index}`} className="space-y-2 text-base text-muted-foreground font-light leading-relaxed">
                        {block.items.map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/65 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }

                  return (
                    <p key={`${post.file}-p-${index}`} className="text-base md:text-[1.08rem] text-muted-foreground font-light leading-[1.9]">
                      {block.text}
                    </p>
                  );
                })}
              </section>

              <div className="pt-10 border-t border-border mt-10 text-center">
                <a
                  href="/blog"
                  className="inline-flex items-center text-sm border border-border px-4 py-2 text-foreground hover:border-foreground hover:bg-foreground hover:text-background transition-colors"
                >
                  Back to blog
                </a>
              </div>
            </>
          ) : null}
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
