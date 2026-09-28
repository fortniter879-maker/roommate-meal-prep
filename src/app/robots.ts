import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/dashboard", "/meals", "/recipes", "/insights", "/households", "/account"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
