// lib/fetchRendered.ts
import * as cheerio from "cheerio";

const WP_BASE = process.env.WP_BASE || "https://unjabbed.app";

export type Rendered = {
  head: string;
  body: string;
  styles: string[];
  bodyClass: string;
};

function abs(u: string) {
  try {
    return new URL(u, WP_BASE).toString();
  } catch {
    return u;
  }
}

export default async function fetchRendered(pathname: string): Promise<Rendered> {
  const url = new URL(pathname || "/", WP_BASE).toString();
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": "unjs-fetch/1.0 (+vercel)" },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  // 1) Clean up WP bits
  $("#wpadminbar").remove();
  $('link[rel="https://api.w.org/"]').remove();

  // 2) Rewrite absolute/relative asset URLs so they load on Vercel
  $('link[href], script[src], img[src]').each((_, el) => {
    const $el = $(el);
    const attr = $el.is("link, a") ? "href" : "src";
    const val = $el.attr(attr);
    if (!val) return;
    if (/^(mailto:|tel:|javascript:|#)/i.test(val)) return;
    $el.attr(attr, abs(val));
  });

  // 3) Fix lazy-loaded images (Elementor, etc.)
  // data-src / data-lazy / data-original => src
  $('[data-src], [data-lazy], [data-original]').each((_, el) => {
    const $el = $(el);
    const lazy =
      $el.attr("data-src") ||
      $el.attr("data-lazy") ||
      $el.attr("data-original");
    if (lazy && !$el.attr("src")) {
      $el.attr("src", abs(lazy));
    }
  });

  // 4) Background images set via inline style (url(/...))
  $('[style]').each((_, el) => {
    const $el = $(el);
    let style = $el.attr("style") || "";
    // Replace url("...") / url('...') / url(...)
    style = style.replace(/url\((['"]?)([^'")]+)\1\)/g, (_, q, p) => {
      if (/^data:|^https?:|^\/\//i.test(p)) return `url(${p})`;
      return `url(${abs(p)})`;
    });
    $el.attr("style", style);
  });

  // 5) Make internal links root-relative so they route to our Next app
  $('a[href]').each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href");
    if (!href || /^(mailto:|tel:|javascript:|#)/i.test(href)) return;
    try {
      const target = new URL(href, WP_BASE);
      const base = new URL(WP_BASE);
      if (target.origin === base.origin) {
        const path = `${target.pathname}${target.search}${target.hash}`;
        $a.attr("href", path || "/");
      }
    } catch {
      /* ignore */
    }
  });

  // Collect stylesheets to include in our layout
  const styles: string[] = [];
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) styles.push(abs(href));
  });

  return {
    head: $("head").html() || "",
    body: $("body").html() || "",
    styles,
    bodyClass: $("body").attr("class") || "",
  };
}
