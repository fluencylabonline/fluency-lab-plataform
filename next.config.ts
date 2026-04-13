import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withSerwistInit from "@serwist/next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const withSerwist = withSerwistInit({
  swSrc: "sw.ts",
  swDest: "public/sw.js",
  disable: false, // Required for PWA testing via dev:pwa (must use --webpack)
  // Precache the offline page
  additionalPrecacheEntries: [{ url: "/offline", revision: "1" }],
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(withSerwist(nextConfig));
