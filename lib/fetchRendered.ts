// lib/fetchRendered.ts
import { load } from "cheerio";

const WP_BASE = process.env.WP_BASE || "https://unjabbed.app";

/**
 * Fetch a fully-rendered WordPress page and return cleaned HTML
 */
export default async function fetchRendered(pathname: string): Promise<string> {
  const url = new URL(pathname, WP_BASE).toString();

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = load(html);

  // 1) Remove admin bar if present
  $("#wpadminbar").remove();

  // Helper – make an absolute URL on the WP domain
  const abs = (u: string | undefined) => {
    if (!u) return u;
    try {
      // already absolute
      new URL(u);
      return u;
    } catch {
      // relative -> resolve against WP
      return new URL(u, WP_BASE).toString();
    }
  };

  // 2) Fix ASSET URLs so they load from WP
  // CSS <link>
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr("href");
    $(el).attr("href", abs(href));
  });
  // JS <script>
  $("script[src]").each((_, el) => {
    const src = $(el).attr("src");
    $(el).attr("src", abs(src));
  });
  // Images / media
  $('img[src], source[src], video[src], audio[src], iframe[src]').each((_, el) => {
    const src = $(el).attr("src");
    $(el).attr("src", abs(src));
  });
  // <img srcset>
  $("img[srcset]").each((_, el) => {
    const srcset = $(el).attr("srcset");
    if (!srcset) return;
    const fixed = srcset
      .split(",")
      .map((part) => {
        const [u, d] = part.trim().split(/\s+/);
        return [abs(u), d].filter(Boolean).join(" ");
      })
      .join(", ");
    $(el).attr("srcset", fixed);
  });

  // 3) Fix inline style url(...) (e.g., background-image)
  $("[style]").each((_, el) => {
    const s = $(el).attr("style");
    if (!s) return;
    const fixed = s.replace(/url\((['"]?)(\/[^)'" ]+)\1\)/g, (_m, q, u) => {
      const full = abs(u);
      return `url(${q}${full}${q})`;
    });
    $(el).attr("style", fixed);
  });

  // 4) Keep navigation inside the Vercel app:
  //    - Internal links to WP should become relative (so our [[...slug]] handles them)
  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") || "").trim();
    if (!href) return;

    // Ignore anchors and external links
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

    // If link points to the WP site (absolute) -> convert to a relative path
    try {
      const u = new URL(href, WP_BASE);
      const isWp = u.origin === new URL(WP_BASE).origin;
      if (isWp) {
        $(el).attr("href", u.pathname + u.search + u.hash);
      }
    } catch {
      // relative already -> fine
    }
  });

  // Optional: strip WP generator meta etc.
  $('meta[name="generator"]').remove();

  return $("body").html() || html;
}
