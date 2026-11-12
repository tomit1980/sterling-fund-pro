import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

const PUBLIC_ROUTES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/platform", priority: 0.9, changeFrequency: "monthly" },
  { path: "/accounts/individual", priority: 0.8, changeFrequency: "monthly" },
  { path: "/accounts/corporate", priority: 0.8, changeFrequency: "monthly" },
  { path: "/accounts/smsf", priority: 0.8, changeFrequency: "monthly" },
  { path: "/support", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/legal/kyc-policy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/legal/regulation", priority: 0.4, changeFrequency: "yearly" },
  { path: "/legal/risk-disclaimer", priority: 0.4, changeFrequency: "yearly" },
  { path: "/legal/privacy-policy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/register", priority: 0.5, changeFrequency: "yearly" },
  { path: "/login", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  const lastModified = new Date(siteConfig.legal.lastUpdated);
  return PUBLIC_ROUTES.map((r) => ({
    url: `${base}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
