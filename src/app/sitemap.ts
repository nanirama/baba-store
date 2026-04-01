import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: "https://baba.ge/",
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://baba.ge/products",
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://baba.ge/online",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://baba.ge/auth/login",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: "https://baba.ge/auth/reset-password",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: "https://baba.ge/dashboard",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.2,
    },
  ];
}
