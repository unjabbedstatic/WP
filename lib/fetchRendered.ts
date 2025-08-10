// lib/fetchRendered.ts
import * as cheerio from "cheerio";

/**
 * Fetch a fully-rendered WordPress page and return cleaned HTML.
 * - Converts all relative asset URLs (css/js/img) to absolute WordPress URLs
 *   so the browser can load them correctly from your WP origin.
 * - Rewrites internal <a> links back to app paths so users stay on Vercel.
 * - Strips the WP admin bar if present.
 */
const WP_BASE = process.env.WP_BASE || "https://unjabbed.app";

export default async function fetchRendered(pathname: string): Promise<string> {
  const url = new URL(pathname, WP_BASE).toString();

  const res = await fetch(url, {
    // Don’t cache during build so you see updates immediately
    cache: "no-store",
    // A friendly UA can sometimes help WP/CDN return full HTML
    headers: { "User-Agent": "unjs-fetch/1.0 (+vercel)" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove admin bar and some non-essential discovery links
  $("#wpadminbar").remove();
  $('link[rel="https://api.w.org/"]').remove();

  // 1) Make all asset URLs absolute to WP (so CSS/JS/IMG actually load)
  $('link[href], script[src], img[src]').each((_, el) => {
    const $el = $(el);
    const attr = $el.is("link, a") ? "href" : "src";
    const val = $el.attr(attr);
    if (!val) return;

    // Already absolute? leave it
    if (/^https?:\/\//i.test(val) || val.startsWith("//")) return;

    // Make absolute against WP_BASE
    try {
      const abs = new URL(val, WP_BASE).toString();
      $el.attr(attr, abs);
    } catch {
      /* ignore bad urls */
    }
  });

  // 2) Rewrite internal <a> links to app paths so navigation stays on Vercel
  $('a[href]').each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href");
    if (!href) return;

    // Skip anchors, mailto, tel, javascript
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return;

    try {
      const target = new URL(href, WP_BASE);
      const wpOrigin = new URL(WP_BASE).origin;

      // If link points to the same WP origin, rewrite to just path+query+hash
      if (target.origin === wpOrigin) {
        const appPath = `${target.pathname}${target.search}${target.hash}`;
        $a.attr("href", appPath);
      }
    } catch {
      /* ignore */
    }
  });

  // Return only the body so our Next layout <html>/<body> wraps it cleanly
  return $("body").html() || "";
}
