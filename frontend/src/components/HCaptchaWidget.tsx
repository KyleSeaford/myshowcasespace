import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    hcaptcha?: {
      render: (
        container: string | HTMLElement,
        params: Record<string, unknown>
      ) => string | number;
      reset: (widgetId?: string | number) => void;
      remove: (widgetId?: string | number) => void;
    };
  }
}

const SCRIPT_ID = "hcaptcha-script";
const SCRIPT_SRC = "https://js.hcaptcha.com/1/api.js?render=explicit";

let hcaptchaScriptPromise: Promise<void> | null = null;

function loadHCaptchaScript(): Promise<void> {
  if (window.hcaptcha) {
    return Promise.resolve();
  }

  if (hcaptchaScriptPromise) {
    return hcaptchaScriptPromise;
  }

  hcaptchaScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load hCaptcha.")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load hCaptcha."));
    document.head.appendChild(script);
  });

  return hcaptchaScriptPromise;
}

interface HCaptchaWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire: () => void;
  onError: (message: string) => void;
  resetSignal: number;
}

const HCaptchaWidget = ({
  siteKey,
  onVerify,
  onExpire,
  onError,
  resetSignal
}: HCaptchaWidgetProps) => {
  const generatedId = useId();
  const containerId = `hcaptcha-${generatedId.replace(/[:]/g, "")}`;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | number | null>(null);
  const verifyRef = useRef(onVerify);
  const expireRef = useRef(onExpire);
  const errorRef = useRef(onError);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    verifyRef.current = onVerify;
    expireRef.current = onExpire;
    errorRef.current = onError;
  }, [onVerify, onExpire, onError]);

  useEffect(() => {
    let active = true;

    void loadHCaptchaScript()
      .then(() => {
        if (!active || !window.hcaptcha || !containerRef.current || widgetIdRef.current !== null) {
          return;
        }

        widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            verifyRef.current(token);
          },
          "expired-callback": () => {
            expireRef.current();
          },
          "error-callback": () => {
            errorRef.current("Captcha failed to load. Please refresh and try again.");
          }
        });
        setIsReady(true);
      })
      .catch((error) => {
        if (active) {
          errorRef.current(error instanceof Error ? error.message : "Failed to load hCaptcha.");
        }
      });

    return () => {
      active = false;
      if (window.hcaptcha && widgetIdRef.current !== null) {
        window.hcaptcha.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  useEffect(() => {
    if (!window.hcaptcha || widgetIdRef.current === null) {
      return;
    }

    window.hcaptcha.reset(widgetIdRef.current);
  }, [resetSignal]);

  return (
    <div className="space-y-2">
      <div id={containerId} ref={containerRef} className="min-h-20" />
      {!isReady ? (
        <p className="text-xs text-muted-foreground">Loading captcha protection...</p>
      ) : null}
    </div>
  );
};

export default HCaptchaWidget;
