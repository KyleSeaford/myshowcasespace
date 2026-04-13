import { describe, expect, it } from "vitest";
import { extractUploadThingKey } from "../src/lib/uploadthing.js";

describe("UploadThing cleanup helpers", () => {
  it("extracts file keys from supported UploadThing URL formats", () => {
    expect(extractUploadThingKey("https://abc123.ufs.sh/f/file-key.jpg")).toBe("file-key.jpg");
    expect(extractUploadThingKey("https://ufs.sh/a/app_123/file-key.webp")).toBe("file-key.webp");
    expect(extractUploadThingKey("https://utfs.io/f/file-key.png")).toBe("file-key.png");
    expect(extractUploadThingKey("https://uploadthing.com/f/file-key.gif")).toBe("file-key.gif");
  });

  it("ignores non-UploadThing URLs", () => {
    expect(extractUploadThingKey("https://example.com/f/file-key.jpg")).toBeNull();
    expect(extractUploadThingKey("/uploads/local-file.jpg")).toBeNull();
    expect(extractUploadThingKey("")).toBeNull();
  });
});
