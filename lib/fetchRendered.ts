// lib/fetchRendered.ts
import { load } from "cheerio";

const WP_BASE = process.env.WP_BASE || "https://unjabbed.app";

export default async function fetchRendered(pathname: string): Promise<{
  head: string;
  bodyClass: string;
  html: string;
  styles: string[];
  scripts: string[]; // absolute <script src> URLs
}> {
  const url = new URL(pathname || "/", WP_BASE).toString();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);

  const raw = await res.text();
  const $ = load(raw);

  $("#wpadminbar").remove();

  const abs = (p: string) => new URL(p, WP_BASE).toString();

  // Make assets absolute
  $("link[href], script[src], img[src], source[src], video[src], audio[src], iframe[src]").each(
    (_i, el) => {
      const $el = $(el);
      const attr = $el.is("link") ? "href" : "src";
      const val = $el.attr(attr);
      if (!val) return;
      if (/^https?:\/\//i.test(val)) return;
      $el.attr(attr, abs(val));
    }
  );

  // Fix inline background-image urls
  $("[style*='url(']").each((_i, el) => {
    const s = $(el).attr("style");
    if (!s) return;
    const updated = s.replace(/url\((['"]?)([^'")]+)\1\)/g, (_m, _q, p) =>
      /^https?:\/\//i.test(p) ? `url(${p})` : `url(${abs(p)})`
    );
    $(el).attr("style", updated);
  });

  // Keep internal links inside the Vercel app
  $("a[href]").each((_i, el) => {
    const $a = $(el);
    const href = $a.attr("href");
    if (!href) return;
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    try {
      const u = new URL(href, WP_BASE);
      if (u.origin === new URL(WP_BASE).origin) {
        $a.attr("href", u.pathname + u.search + u.hash);
      }
    } catch {}
  });

  // Collect CSS and JS
  const styles: string[] = [];
  $('link[rel="stylesheet"]').each((_i, el) => {
    const href = $(el).attr("href");
    if (href) styles.push(href);
  });

  const scripts: string[] = [];
  $("script[src]").each((_i, el) => {
    const src = $(el).attr("src");
    if (src) scripts.push(src);
  });

  return {
    head: $("head").html() ?? "",
    bodyClass: $("body").attr("class") ?? "",
    html: $("body").html() ?? "",
    styles,
    scripts,
  };
}
