import type { FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcryptjs";
import type { PrismaClient, User } from "@prisma/client";
import { env } from "../config/env.js";
import { newSessionToken, sha256 } from "./crypto.js";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(prisma: PrismaClient, userId: string): Promise<string> {
  const token = newSessionToken();
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  return token;
}

export async function getUserFromSession(
  prisma: PrismaClient,
  sessionToken: string | undefined
): Promise<User | null> {
  if (!sessionToken) {
    return null;
  }

  const tokenHash = sha256(sessionToken);
  const now = new Date();

  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      expiresAt: {
        gt: now
      }
    },
    include: {
      user: true
    }
  });

  return session?.user ?? null;
}

export async function destroySession(prisma: PrismaClient, sessionToken: string | undefined): Promise<void> {
  if (!sessionToken) {
    return;
  }

  const tokenHash = sha256(sessionToken);
  await prisma.session.deleteMany({
    where: {
      tokenHash
    }
  });
}

export function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(env.COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: env.SESSION_TTL_HOURS * 60 * 60
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(env.COOKIE_NAME, {
    path: "/"
  });
}

export function sessionTokenFromRequest(request: FastifyRequest): string | undefined {
  return request.cookies[env.COOKIE_NAME];
}