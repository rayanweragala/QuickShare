package com.quickshare.backend.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * SEO-related endpoints for robots.txt and sitemap
 */
@RestController
public class SeoController {
    /**
     * Serve robots.txt for search engine crawlers
     */
    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public String robotsTxt() {
        return """
                User-agent: *
                Allow: /
                Disallow: /api/
                
                Allow: /assets/
                Allow: /favicon.png
                Allow: /manifest.json
                
                Sitemap: https://localshare-15ui.onrender.com/sitemap.xml
                Crawl-delay: 1
                """;
    }

    /**
     * Serve sitemap.xml for search engine indexing
     */
    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String sitemap() {
        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                    <url>
                        <loc>https://localshare-15ui.onrender.com/</loc>
                        <lastmod>2025-01-01</lastmod>
                        <changefreq>weekly</changefreq>
                        <priority>1.0</priority>
                    </url>
                </urlset>
                """;
    }
}
