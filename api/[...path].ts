import type { FastifyInstance } from "fastify";
import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/db/client.js";

declare global {
  // Reuse the initialized app between invocations in the same runtime.
  // eslint-disable-next-line no-var
  var __myShowcaseSpaceVercelApp: Promise<FastifyInstance> | undefined;
}

function normalizeApiPath(url?: string): string {
  if (!url || url === "/api") {
    return "/";
  }

  return url.startsWith("/api/") ? url.slice(4) || "/" : url;
}

async function getApp(): Promise<FastifyInstance> {
  if (!globalThis.__myShowcaseSpaceVercelApp) {
    globalThis.__myShowcaseSpaceVercelApp = (async () => {
      const app = buildApp({
        logger: false,
        prisma
      });

      await app.ready();
      return app;
    })();
  }

  return globalThis.__myShowcaseSpaceVercelApp;
}

export default async function handler(
  req: IncomingMessage & { url?: string },
  res: ServerResponse
): Promise<void> {
  req.url = normalizeApiPath(req.url);

  try {
    const app = await getApp();
    app.server.emit("request", req, res);
  } catch {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
    }

    if (!res.writableEnded) {
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
}
