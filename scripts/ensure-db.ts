import { mkdir, open } from "node:fs/promises";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

async function ensureSqliteFile(): Promise<void> {
  if (!databaseUrl.startsWith("file:")) {
    return;
  }

  const fileRef = databaseUrl.slice("file:".length);
  if (!fileRef || fileRef === ":memory:") {
    return;
  }

  const normalized = fileRef.startsWith("./") ? fileRef.slice(2) : fileRef;
  const resolvedPath = path.isAbsolute(normalized)
    ? normalized
    : path.resolve("prisma", normalized);

  await mkdir(path.dirname(resolvedPath), { recursive: true });
  const handle = await open(resolvedPath, "a");
  await handle.close();
}

ensureSqliteFile().catch((error) => {
  console.error(error);
  process.exit(1);
});