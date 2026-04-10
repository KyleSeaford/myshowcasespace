import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

type BlogPost = {
  file: string;
  slug: string;
  title: string;
  author: string;
  publishedAt: string;
  excerpt: string;
  coverImage: string;
  body: string;
};

function resolveBlogContentDir(): string {
  return process.env.BLOG_CONTENT_DIR || path.resolve(process.cwd(), "frontend", "public", "blog-content");
}

function slugFromFile(file: string): string {
  return file.replace(/\.md$/i, "");
}

function parseFrontmatter(markdown: string): { meta: Record<string, string>; body: string } {
  if (!markdown.startsWith("---")) {
    return { meta: {}, body: markdown.trim() };
  }

  const endIndex = markdown.indexOf("\n---", 3);
  if (endIndex === -1) {
    return { meta: {}, body: markdown.trim() };
  }

  const rawMeta = markdown.slice(3, endIndex).trim();
  const body = markdown.slice(endIndex + 4).trim();
  const meta: Record<string, string> = {};

  rawMeta.split("\n").forEach((line) => {
    const separator = line.indexOf(":");
    if (separator === -1) {
      return;
    }

    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1");

    if (key) {
      meta[key] = value;
    }
  });

  return { meta, body };
}

function parsePublishedAt(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    return Number.NEGATIVE_INFINITY;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return Date.UTC(Number(year), Number(month) - 1, Number(day));
  }

  const dmyMatch = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return Date.UTC(Number(year), Number(month) - 1, Number(day));
  }

  const timestamp = Date.parse(trimmed);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

async function listMarkdownFiles(): Promise<string[]> {
  try {
    const entries = await readdir(resolveBlogContentDir(), { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile() && /\.md$/i.test(entry.name))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function loadBlogPostFromFile(file: string): Promise<BlogPost> {
  const fullPath = path.join(resolveBlogContentDir(), file);
  const markdown = await readFile(fullPath, "utf8");
  const parsed = parseFrontmatter(markdown);

  return {
    file,
    slug: parsed.meta.slug || slugFromFile(file),
    title: parsed.meta.title || file,
    author: parsed.meta.author || "Unknown author",
    publishedAt: parsed.meta.publishedAt || "",
    excerpt: parsed.meta.excerpt || "",
    coverImage: parsed.meta.coverImage || "",
    body: parsed.body
  };
}

async function loadBlogPostsFromDisk(): Promise<BlogPost[]> {
  const files = await listMarkdownFiles();
  const posts = await Promise.all(files.map((file) => loadBlogPostFromFile(file)));

  posts.sort((left, right) => {
    const publishedDelta = parsePublishedAt(right.publishedAt) - parsePublishedAt(left.publishedAt);
    if (publishedDelta !== 0) {
      return publishedDelta;
    }

    return left.file.localeCompare(right.file);
  });

  return posts;
}

export const blogRoutes: FastifyPluginAsync = async (app) => {
  app.get("/blog/posts", async () => {
    const posts = await loadBlogPostsFromDisk();
    return { posts };
  });

  app.get("/blog/posts/:slug", async (request, reply) => {
    const params = z.object({ slug: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid slug" });
    }

    const posts = await loadBlogPostsFromDisk();
    const post = posts.find((entry) => entry.slug === params.data.slug);

    if (!post) {
      return reply.status(404).send({ error: "Blog post not found" });
    }

    return { post };
  });
};
