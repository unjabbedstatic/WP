// lib/fetchRendered.ts
import { load } from "cheerio";

const WP_BASE = process.env.WP_BASE || "https://unjabbed.app";

/**
 * Fetch a fully-rendered WordPress page and return the parts we need.
 */
export default async function fetchRendered(
  pathname: string
): Promise<{ head: string; bodyClass: string; html: string }> {
  const url = new URL(pathname || "/", WP_BASE).toString();

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);

  const raw = await res.text();
  const $ = load(raw);

  // Remove admin bar if present
  $("#wpadminbar").remove();

  const absolutize = (p: string) => new URL(p, WP_BASE).toString();

  // Make asset URLs absolute so CSS/JS/images load on Vercel
  $("link[href], script[src], img[src], source[src], video[src], audio[src], iframe[src]").each(
    (_i, el) => {
      const $el = $(el);
      const attr = $el.is("link") ? "href" : "src";
      const val = $el.attr(attr);
      if (!val) return;
      if (/^https?:\/\//i.test(val)) return; // already absolute
      $el.attr(attr, absolutize(val));
    }
  );

  // Fix inline CSS background-image: url(...)
  $("[style*='url(']").each((_i, el) => {
    const s = $(el).attr("style");
    if (!s) return;
    const updated = s.replace(/url\((['"]?)([^'")]+)\1\)/g, (_m, _q, p) => {
      if (/^https?:\/\//i.test(p)) return `url(${p})`;
      return `url(${absolutize(p)})`;
    });
    $(el).attr("style", updated);
  });

  // Keep internal nav links relative so they stay on the Vercel domain
  $("a[href]").each((_i, el) => {
    const $a = $(el);
    const href = $a.attr("href");
    if (!href) return;

    if (href.startsWith(WP_BASE)) {
      try {
        const u = new URL(href);
        $a.attr("href", u.pathname + u.search + u.hash);
      } catch {}
      return;
    }

    if (/^https?:\/\//i.test(href)) return; // external links ok
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
  });

  const head = $("head").html() ?? "";
  const bodyClass = $("body").attr("class") ?? "";
  const html = $("body").html() ?? "";

  return { head, bodyClass, html };
}
