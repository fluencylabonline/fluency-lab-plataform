import type { MetadataRoute } from "next";
import { env } from "@/env/client";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://www.fluencylab.me";

  const routes = [
    { path: "", priority: 1.0 },
    { path: "/faq", priority: 0.7 },
    { path: "/download", priority: 0.6 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ];

  return routes.map(({ path, priority }) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: "monthly" as const,
    priority,
  }));
}
