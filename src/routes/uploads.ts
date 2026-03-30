import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { UTApi, UTFile } from "uploadthing/server";
import { env } from "../config/env.js";
import { requireAuth, requireOwnedTenant } from "../lib/guards.js";

const uploadsDir = path.resolve(process.cwd(), "uploads");
const utApi = env.UPLOADTHING_TOKEN ? new UTApi({ token: env.UPLOADTHING_TOKEN }) : null;

const allowedImageMimeTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif"
};

const contentTypeByExtension: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif"
};

const fileNameSchema = z.object({
  fileName: z.string().regex(/^[a-zA-Z0-9._-]+$/).max(200)
});

function getTenantIdFieldValue(raw: unknown): string {
  if (!raw || typeof raw !== "object" || !("value" in raw)) {
    return "";
  }
  const maybeValue = (raw as { value?: unknown }).value;
  return typeof maybeValue === "string" ? maybeValue.trim() : "";
}

function getFieldValue(raw: unknown): string {
  if (!raw || typeof raw !== "object" || !("value" in raw)) {
    return "";
  }
  const maybeValue = (raw as { value?: unknown }).value;
  return typeof maybeValue === "string" ? maybeValue.trim() : "";
}

function sanitizeForFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const uploadRoutes: FastifyPluginAsync = async (app) => {
  app.post("/uploads/images", async (request, reply) => {
    if (!(await requireAuth(request, reply))) {
      return;
    }

    if (!utApi) {
      return reply.status(500).send({
        error: "UploadThing is not configured. Set UPLOADTHING_TOKEN in server env."
      });
    }

    const file = await request.file({
      limits: {
        files: 1,
        fileSize: 8 * 1024 * 1024
      }
    });

    if (!file) {
      return reply.status(400).send({ error: "Image file is required" });
    }

    const tenantId = getTenantIdFieldValue(file.fields.tenantId);
    const requestedTenantSlug = sanitizeForFileName(getFieldValue(file.fields.tenantSlug));
    let tenantSlugForName = requestedTenantSlug;
    let tenantIdForCustomId = "";
    if (tenantId) {
      const tenant = await requireOwnedTenant(request, reply, tenantId);
      if (!tenant) {
        return;
      }
      tenantSlugForName = sanitizeForFileName(tenant.slug);
      tenantIdForCustomId = tenant.id;
    }

    const extension = allowedImageMimeTypes[file.mimetype];
    if (!extension) {
      return reply
        .status(415)
        .send({ error: "Unsupported image type. Use JPG, PNG, WEBP, or GIF." });
    }

    const buffer = await file.toBuffer();
    if (!buffer.length) {
      return reply.status(400).send({ error: "Uploaded file is empty" });
    }

    const fileBytes = new Uint8Array(buffer);
    const safeTenantSlug = tenantSlugForName || "new-tenant";
    const fileName = `tenant-${safeTenantSlug}-about-picture-${Date.now()}${extension}`;
    const customId = tenantIdForCustomId
      ? `tenant-${tenantIdForCustomId}-about-picture-${Date.now()}`
      : undefined;

    const uploadFile = new UTFile([fileBytes], fileName, {
      type: file.mimetype,
      customId
    });
    const result = await utApi.uploadFiles(uploadFile);

    if (result.error) {
      request.log.error({ uploadthingError: result.error }, "UploadThing upload failed");
      return reply.status(502).send({ error: "UploadThing upload failed" });
    }

    const uploadedUrl = result.data.ufsUrl || result.data.url;
    if (!uploadedUrl) {
      return reply.status(502).send({ error: "UploadThing did not return a file URL" });
    }

    return reply.status(201).send({
      url: uploadedUrl,
      directUrl: uploadedUrl,
      fileName,
      key: result.data.key,
      size: buffer.length,
      contentType: file.mimetype
    });
  });

  app.get("/uploads/:fileName", async (request, reply) => {
    const params = fileNameSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid file name" });
    }

    const resolvedPath = path.resolve(uploadsDir, params.data.fileName);
    const baseDir = uploadsDir.endsWith(path.sep) ? uploadsDir : `${uploadsDir}${path.sep}`;
    if (!resolvedPath.startsWith(baseDir)) {
      return reply.status(400).send({ error: "Invalid file path" });
    }

    try {
      const fileStats = await stat(resolvedPath);
      if (!fileStats.isFile()) {
        return reply.status(404).send({ error: "File not found" });
      }
    } catch {
      return reply.status(404).send({ error: "File not found" });
    }

    const extension = path.extname(params.data.fileName).toLowerCase();
    const contentType = contentTypeByExtension[extension] ?? "application/octet-stream";

    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.type(contentType).send(createReadStream(resolvedPath));
  });
};
