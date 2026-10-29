"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function uuid(key: string, persistent: Storage) {
  let value = persistent.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    persistent.setItem(key, value);
  }
  return value;
}

type EventType = "page_view" | "read_session";

function send(event: {
  visitorId: string;
  sessionId: string;
  eventType: EventType;
  storyId: string | null;
  path: string;
  activeSeconds?: number;
  scrollCount?: number;
  maxScrollPercent?: number;
}) {
  void fetch("/api/telemetry", {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(event),
  }).catch(() => undefined);
}

export function PageTelemetry() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const visitorId = uuid("signalos_visitor", window.localStorage);
    const sessionId = uuid("signalos_session", window.sessionStorage);
    const match = pathname.match(/^\/stories\/([0-9a-f-]{36})$/i);
    const storyId = match?.[1] ?? null;
    let activeMs = 0;
    let resumedAt = document.visibilityState === "visible" ? Date.now() : null;
    let scrollCount = 0;
    let maxScrollPercent = 0;
    let lastScrollBurstAt = 0;
    let finished = false;

    const recordDepth = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0) maxScrollPercent = Math.max(maxScrollPercent, Math.min(100, Math.round((window.scrollY / max) * 100)));
    };
    const onScroll = () => {
      const now = Date.now();
      if (now - lastScrollBurstAt > 900) scrollCount += 1;
      lastScrollBurstAt = now;
      recordDepth();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (resumedAt !== null) activeMs += Date.now() - resumedAt;
        resumedAt = null;
      } else if (resumedAt === null) {
        resumedAt = Date.now();
      }
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      if (resumedAt !== null) activeMs += Date.now() - resumedAt;
      if (storyId && activeMs >= 1000) {
        send({
          visitorId, sessionId, eventType: "read_session", storyId, path: pathname,
          activeSeconds: Math.min(86400, Math.round(activeMs / 1000)), scrollCount, maxScrollPercent,
        });
      }
    };

    send({ visitorId, sessionId, eventType: "page_view", storyId, path: pathname });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", finish);
    return () => {
      finish();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", finish);
    };
  }, [pathname]);

  return null;
}
