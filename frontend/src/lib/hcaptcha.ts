const LOCAL_DEV_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY ?? "";

export function isHCaptchaEnabled(): boolean {
  const hostname = window.location.hostname.trim().toLowerCase();
  if (LOCAL_DEV_HOSTS.has(hostname)) {
    return false;
  }

  return HCAPTCHA_SITE_KEY.trim().length > 0;
}
