import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { getUserFromSession, sessionTokenFromRequest } from "../lib/auth.js";

const authContextPlugin: FastifyPluginAsync = async (app) => {
  app.decorateRequest("user", null);

  app.addHook("preHandler", async (request) => {
    try {
      const token = sessionTokenFromRequest(request);
      request.user = await getUserFromSession(app.prisma, token);
    } catch (error) {
      request.log.warn(
        { err: error },
        "Failed to resolve user from session. Continuing request without authenticated user."
      );
      request.user = null;
    }
  });
};

export const authContext = fp(authContextPlugin, {
  name: "auth-context"
});
