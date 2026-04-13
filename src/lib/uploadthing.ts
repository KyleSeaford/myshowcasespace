import type { FastifyBaseLogger } from "fastify";
import { UTApi } from "uploadthing/server";
import { env } from "../config/env.js";

export const uploadThingApi = env.UPLOADTHING_TOKEN ? new UTApi({ token: env.UPLOADTHING_TOKEN }) : null;

const uploadThingHosts = new Set(["uploadthing.com", "ufs.sh", "utfs.io"]);

function isUploadThingHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return uploadThingHosts.has(normalized) || normalized.endsWith(".ufs.sh") || normalized.endsWith(".utfs.io");
}

function safeDecodeUriComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function extractUploadThingKey(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(fileUrl);
  } catch {
    return null;
  }

  if (!isUploadThingHost(parsed.hostname)) {
    return null;
  }

  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  const [prefix] = parts;
  if (prefix !== "f" && prefix !== "a") {
    return null;
  }

  const key = parts.at(-1);
  return key ? safeDecodeUriComponent(key) : null;
}

export async function deleteUploadThingFileByUrl(
  fileUrl: string | null | undefined,
  logger?: FastifyBaseLogger
): Promise<boolean> {
  const key = extractUploadThingKey(fileUrl);
  if (!key) {
    return false;
  }

  if (!uploadThingApi) {
    logger?.warn({ uploadThingKey: key }, "Skipped UploadThing file deletion because UploadThing is not configured");
    return false;
  }

  try {
    const result = await uploadThingApi.deleteFiles(key);
    if (!result.success) {
      logger?.warn({ uploadThingKey: key, result }, "UploadThing file deletion was not successful");
      return false;
    }

    return true;
  } catch (error) {
    logger?.warn({ uploadThingKey: key, error }, "UploadThing file deletion failed");
    return false;
  }
}
