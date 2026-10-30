import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  transpilePackages: ["@signalos/shared"],
};

export default withSentryConfig(nextConfig, {
  org: "uba-veltech-attendance-system",
  project: "my_newssite",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
});
