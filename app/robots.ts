import type { MetadataRoute } from "next";
import { env } from "@/env/client";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://www.fluencylab.me";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/hub/",
          "/onboarding/",
          "/notebook/",
          "/pending-cancellation/",
          "/convert-class/",
          "/suspended/",
          "/offline",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
