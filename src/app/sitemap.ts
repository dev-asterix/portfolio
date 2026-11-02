import type { MetadataRoute } from "next";
import { PROFILE } from "@/lib/profile";
import { PROJECTS } from "@/lib/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = PROFILE.siteUrl;
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/os`, changeFrequency: "monthly", priority: 0.6 },
    ...PROJECTS.map((p) => ({
      url: `${base}/projects/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: p.featured ? 0.8 : 0.5,
    })),
  ];
}
