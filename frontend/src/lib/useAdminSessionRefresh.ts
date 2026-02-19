// Admin session refresh helpers
"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  AuthError,
  getStoredToken,
  getStoredTokenExpiresAt,
  refreshSession,
  storeSession
} from "@/lib/adminApi";

type SessionRefreshOptions = {
  onExpired?: () => void;
  refreshThresholdMs?: number;
  throttleMs?: number;
};

const DEFAULT_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
const DEFAULT_THROTTLE_MS = 30 * 1000;
const CHECK_INTERVAL_MS = 60 * 1000;

export function useAdminSessionRefresh(options: SessionRefreshOptions = {}) {
  const {
    onExpired,
    refreshThresholdMs = DEFAULT_REFRESH_THRESHOLD_MS,
    throttleMs = DEFAULT_THROTTLE_MS
  } = options;
  const lastActivityRef = useRef(Date.now());
  const lastRefreshAttemptRef = useRef(0);
  const expiresAtRef = useRef<number | null>(null);

  const syncExpiresAt = useCallback(() => {
    const stored = getStoredTokenExpiresAt();
    expiresAtRef.current = stored ? Date.parse(stored) : null;
  }, []);

  const refreshIfNeeded = useCallback(
    async (force: boolean) => {
      const token = getStoredToken();
      if (!token) {
        return;
      }
      if (!expiresAtRef.current) {
        syncExpiresAt();
      }
      const expiresAt = expiresAtRef.current;
      if (!expiresAt && !force) {
        return;
      }
      if (expiresAt) {
        const remaining = expiresAt - Date.now();
        if (!force && remaining > refreshThresholdMs) {
          return;
        }
      }
      const now = Date.now();
      if (now - lastRefreshAttemptRef.current < throttleMs) {
        return;
      }
      lastRefreshAttemptRef.current = now;
      try {
        const response = await refreshSession(token);
        storeSession(response);
        expiresAtRef.current = Date.parse(response.expiresAt);
      } catch (err) {
        if (err instanceof AuthError) {
          onExpired?.();
        }
      }
    },
    [onExpired, refreshThresholdMs, syncExpiresAt, throttleMs]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    syncExpiresAt();

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      void refreshIfNeeded(!expiresAtRef.current);
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart"
    ];
    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));

    const intervalId = window.setInterval(() => {
      if (!expiresAtRef.current) {
        syncExpiresAt();
        return;
      }
      if (Date.now() > expiresAtRef.current) {
        onExpired?.();
        return;
      }
      if (Date.now() - lastActivityRef.current < refreshThresholdMs) {
        void refreshIfNeeded(false);
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      window.clearInterval(intervalId);
    };
  }, [onExpired, refreshIfNeeded, refreshThresholdMs, syncExpiresAt]);
}
