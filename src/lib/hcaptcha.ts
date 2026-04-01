import { env } from "../config/env.js";

const VERIFY_URL = "https://api.hcaptcha.com/siteverify";
const LOCAL_DEV_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

type HCaptchaApiResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

type HCaptchaVerificationResult =
  | { ok: true; skipped: boolean }
  | { ok: false; statusCode: number; message: string; errorCodes: string[] };

export async function verifyHCaptchaToken(
  token: string | undefined,
  remoteIp: string | undefined,
  hostHeader?: string
): Promise<HCaptchaVerificationResult> {
  const requestHost = hostHeader?.split(":")[0]?.trim().toLowerCase();
  if (env.NODE_ENV !== "production" && requestHost && LOCAL_DEV_HOSTS.has(requestHost)) {
    return { ok: true, skipped: true };
  }

  if (!env.HCAPTCHA_SECRET_KEY) {
    if (env.NODE_ENV === "production") {
      return {
        ok: false,
        statusCode: 503,
        message: "Captcha verification is not configured.",
        errorCodes: ["captcha-not-configured"]
      };
    }

    return { ok: true, skipped: true };
  }

  if (!token) {
    return {
      ok: false,
      statusCode: 400,
      message: "Please complete the captcha challenge.",
      errorCodes: ["missing-input-response"]
    };
  }

  const form = new URLSearchParams({
    secret: env.HCAPTCHA_SECRET_KEY,
    response: token
  });

  if (remoteIp) {
    form.set("remoteip", remoteIp);
  }

  if (env.HCAPTCHA_SITE_KEY) {
    form.set("sitekey", env.HCAPTCHA_SITE_KEY);
  }

  let response: Response;
  try {
    response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form.toString()
    });
  } catch {
    return {
      ok: false,
      statusCode: 503,
      message: "Captcha verification is currently unavailable. Please try again.",
      errorCodes: ["captcha-request-failed"]
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      statusCode: 503,
      message: "Captcha verification is currently unavailable. Please try again.",
      errorCodes: ["captcha-service-unavailable"]
    };
  }

  const payload = (await response.json()) as HCaptchaApiResponse;
  if (!payload.success) {
    return {
      ok: false,
      statusCode: 403,
      message: "Captcha verification failed. Please try again.",
      errorCodes: Array.isArray(payload["error-codes"]) ? payload["error-codes"] : []
    };
  }

  return { ok: true, skipped: false };
}
