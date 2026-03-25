import { createHash } from "node:crypto";
import { customAlphabet } from "nanoid";

const apiKeyAlphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const tenantCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const sessionAlphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";

const createSessionToken = customAlphabet(sessionAlphabet, 64);
const createApiSecret = customAlphabet(apiKeyAlphabet, 48);
const createTenantCode = customAlphabet(tenantCodeAlphabet, 10);

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function newSessionToken(): string {
  return `sess_${createSessionToken()}`;
}

export function newTenantCode(): string {
  return createTenantCode();
}

export function newApiKey(): { raw: string; preview: string; hash: string } {
  const secret = createApiSecret();
  const raw = `mssk_${secret}`;
  return {
    raw,
    preview: `${raw.slice(0, 12)}...`,
    hash: sha256(raw)
  };
}