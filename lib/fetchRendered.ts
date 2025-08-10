// lib/fetchRendered.ts
import * as cheerio from "cheerio";

const WP_BASE = process.env.WP_BASE || "https://unjabbed.app";

export type Rendered = {
  head: string;
  body: string;
  styles: string[];
};

export default async function fetchRendered(pathname: string): Promise<Rendered> {
  const url = new URL(pathname, WP_BASE).toString();
  const res = await fetch(url, { cache: "no-store", headers: { "User-Agent": "unjs-fetch/1.0 (+vercel)" } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  $("#wpadminbar").remove();
  $('link[rel="https://api.w.org/"]').remove();

  $('link[href], script[src], img[src]').each((_, el) => {
    const $el = $(el);
    const attr = $el.is("link, a") ? "href" : "src";
    const val = $el.attr(attr);
    if (!val) return;
    if (/^https?:\/\//i.test(val) || val.startsWith("//")) return;
    try { $el.attr(attr, new URL(val, WP_BASE).toString()); } catch {}
  });

  $('a[href]').each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href");
    if (!href || /^(mailto:|tel:|javascript:|#)/i.test(href)) return;
    try {
      const target = new URL(href, WP_BASE);
      if (target.origin === new URL(WP_BASE).origin) {
        $a.attr("href", `${target.pathname}${target.search}${target.hash}`);
      }
    } catch {}
  });

  const styles: string[] = [];
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) styles.push(href);
  });

  return {
    head: $("head").html() || "",
    body: $("body").html() || "",
    styles,
  };
}
