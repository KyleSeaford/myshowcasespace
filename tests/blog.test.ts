import { afterEach, describe, expect, it } from "vitest";
import { closeTestApp, createTestApp } from "./setup.js";

describe("blog routes", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (cleanup) {
      await cleanup();
      cleanup = undefined;
    }
  });

  it("loads markdown posts directly from the blog content folder", async () => {
    const { app, prisma } = await createTestApp();
    cleanup = async () => closeTestApp(app, prisma);

    const postsResponse = await app.inject({
      method: "GET",
      url: "/blog/posts"
    });

    expect(postsResponse.statusCode).toBe(200);
    const postsBody = postsResponse.json();
    expect(Array.isArray(postsBody.posts)).toBe(true);
    expect(postsBody.posts.length).toBeGreaterThan(0);
    expect(postsBody.posts.some((post: { slug: string }) => post.slug === "what-is")).toBe(true);

    const postResponse = await app.inject({
      method: "GET",
      url: "/blog/posts/what-is"
    });

    expect(postResponse.statusCode).toBe(200);
    const postBody = postResponse.json();
    expect(postBody.post.slug).toBe("what-is");
    expect(postBody.post.title).toBeTruthy();
    expect(postBody.post.body.length).toBeGreaterThan(0);
  });
});
