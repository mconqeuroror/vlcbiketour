import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/metadata";

// robots.txt is crawl guidance, not a security control: private data must
// simply never be published, regardless of what is disallowed here.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
