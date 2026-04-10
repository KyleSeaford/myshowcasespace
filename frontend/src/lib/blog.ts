export type BlogPost = {
  file: string;
  slug: string;
  title: string;
  author: string;
  publishedAt: string;
  excerpt: string;
  coverImage: string;
  body: string;
};

export type MarkdownBlock =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

const BLOG_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL ?? "/api"}/blog`;

export function markdownToBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    blocks.push({ type: "p", text: paragraphBuffer.join(" ").trim() });
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push({ type: "ul", items: [...listBuffer] });
    listBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h1", text: line.slice(2).trim() });
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h3", text: line.slice(4).trim() });
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      listBuffer.push(line.slice(2).trim());
      continue;
    }

    flushList();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

export async function loadBlogPosts(): Promise<BlogPost[]> {
  const response = await fetch(`${BLOG_API_BASE_URL}/posts`);
  if (!response.ok) {
    throw new Error("Could not load blog posts.");
  }

  const payload = (await response.json()) as { posts: BlogPost[] };
  return payload.posts;
}

export async function loadBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const response = await fetch(`${BLOG_API_BASE_URL}/posts/${encodeURIComponent(slug)}`);
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Could not load blog post.");
  }

  const payload = (await response.json()) as { post: BlogPost };
  return payload.post;
}
