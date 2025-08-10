// lib/fetchRendered.ts
import cheerio from "cheerio";

const WP_BASE = process.env.WP_BASE || "https://unjabbed.app";

/**
 * Fetch a fully-rendered WordPress page and return pieces we need
 * for Next.js: <head> HTML, <body> class, and the body HTML.
 */
export default async function fetchRendered(
  pathname: string
): Promise<{ head: string; bodyClass: string; html: string }> {
  const url = new URL(pathname || "/", WP_BASE).toString();

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);

  const raw = await res.text();
  const $ = cheerio.load(raw);

  // Remove admin bar if it appears
  $("#wpadminbar").remove();

  // Make asset URLs absolute so they load from WP on Vercel
  const absolutize = (href: string) => new URL(href, WP_BASE).toString();

  // 1) Assets that must stay absolute (not internal navigation)
  $("link[href], script[src], img[src], source[src], video[src], audio[src], iframe[src]").each(
    (_i, el) => {
      const $el = $(el);
      const attr = $el.is("link") || $el.is("a") ? "href" : "src";
      const val = $el.attr(attr);
      if (!val) return;
      // leave already-absolute http(s) alone
      if (/^https?:\/\//i.test(val)) return;
      $el.attr(attr, absolutize(val));
    }
  );

  // 2) Inline CSS background-image: url(...)
  $("[style*='url(']").each((_i, el) => {
    const s = $(el).attr("style");
    if (!s) return;
    const updated = s.replace(/url\((['"]?)([^'")]+)\1\)/g, (_m, q, p) => {
      if (/^https?:\/\//i.test(p)) return `url(${p})`;
      return `url(${absolutize(p)})`;
    });
    $(el).attr("style", updated);
  });

  // 3) Convert internal page links to relative (so they stay within Vercel site)
  $("a[href]").each((_i, el) => {
    const $a = $(el);
    const href = $a.attr("href");
    if (!href) return;

    // Absolute links to our WP site -> make them relative
    if (href.startsWith(WP_BASE)) {
      try {
        const u = new URL(href);
        $a.attr("href", u.pathname + u.search + u.hash);
      } catch {}
      return;
    }

    // Leave external links alone
    if (/^https?:\/\//i.test(href)) return;

    // Keep hash-only and mailto/tel as-is
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

    // Already looks relative – fine
  });

  const head = $("head").html() || "";
  const bodyClass = $("body").attr("class") || "";
  const bodyHtml = $("body").html() || "";

  return { head, bodyClass, html: bodyHtml };
}
