export type BlogManifest = {
  posts: Array<{
    file: string;
  }>;
};

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

const BLOG_CONTENT_BASE_PATH = "/blog-content";

function slugFromFile(file: string): string {
  return file.replace(/\.md$/i, "");
}

function parseFrontmatter(markdown: string): { meta: Record<string, string>; body: string } {
  if (!markdown.startsWith("---")) {
    return { meta: {}, body: markdown };
  }

  const endIndex = markdown.indexOf("\n---", 3);
  if (endIndex === -1) {
    return { meta: {}, body: markdown };
  }

  const rawMeta = markdown.slice(3, endIndex).trim();
  const body = markdown.slice(endIndex + 4).trim();
  const meta: Record<string, string> = {};

  rawMeta.split("\n").forEach((line) => {
    const separator = line.indexOf(":");
    if (separator === -1) return;

    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1");

    if (key) meta[key] = value;
  });

  return { meta, body };
}

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
  const manifestResponse = await fetch(`${BLOG_CONTENT_BASE_PATH}/index.json`);
  if (!manifestResponse.ok) {
    throw new Error("Could not load blog index file.");
  }

  const manifest = (await manifestResponse.json()) as BlogManifest;
  const loadedPosts = await Promise.all(
    manifest.posts.map(async (entry) => {
      const response = await fetch(`${BLOG_CONTENT_BASE_PATH}/${entry.file}`);
      if (!response.ok) {
        throw new Error(`Could not load ${entry.file}`);
      }

      const markdown = await response.text();
      const parsed = parseFrontmatter(markdown);

      return {
        file: entry.file,
        slug: parsed.meta.slug || slugFromFile(entry.file),
        title: parsed.meta.title || entry.file,
        author: parsed.meta.author || "Unknown author",
        publishedAt: parsed.meta.publishedAt || "",
        excerpt: parsed.meta.excerpt || "",
        coverImage: parsed.meta.coverImage || "",
        body: parsed.body,
      } satisfies BlogPost;
    }),
  );

  loadedPosts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return loadedPosts;
}

export async function loadBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await loadBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}
