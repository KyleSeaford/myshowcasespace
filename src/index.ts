import { env } from "./config/env.js";
import { prisma } from "./db/client.js";
import { buildApp } from "./app.js";

const app = buildApp({ logger: true, prisma });

async function start(): Promise<void> {
  try {
    await app.listen({
      host: "0.0.0.0",
      port: env.PORT
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

const shutdown = async (): Promise<void> => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

void start();