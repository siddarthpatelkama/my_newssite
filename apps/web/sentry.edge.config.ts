import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://3108befb43ce9bb89eab4686c3fc03b1@o4511316597342208.ingest.us.sentry.io/4512347138949120",
  tracesSampleRate: 1.0,
});

