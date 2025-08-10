// lib/fetchRendered.ts
import { load } from "cheerio";

const WP_BASE = process.env.WP_BASE || "https://unjabbed.app";
const WP_HOST = new URL(WP_BASE).host;

type LinkAttrs = { [k: string]: string };

export type Rendered = {
  headLinks: LinkAttrs[];        // <link rel="stylesheet" ...>
  headStyleTags: string[];       // contents of <style> tags
  headScriptSrcs: string[];      // <script src> in <head>
  headInlineScripts: string[];   // inline <script> in <head>

  bodyHtml: string;              // inner HTML of <body>
  bodyClass: string;             // class attribute of <body>
  bodyScriptSrcs: string[];      // <script src> in <body>
  bodyInlineScripts: string[];   // inline <script> in <body>
};

function abs(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try { return new URL(url, WP_BASE).toString(); } catch { return url; }
}

export default async function fetchRendered(pathname: string): Promise<Rendered> {
  const url = new URL(pathname || "/", WP_BASE).toString();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  const html = await res.text();
  const $ = load(html);

  // Remove admin bar if present
  $("#wpadminbar").remove();

  // Fix lazy images and relative asset URLs
  $("[data-src]").each((_, el) => {
    const $el = $(el);
    const ds = $el.attr("data-src");
    if (ds) $el.attr("src", abs(ds)!);
  });
  $("[data-srcset]").each((_, el) => {
    const $el = $(el);
    const dss = $el.attr("data-srcset");
    if (dss) $el.attr("srcset", dss); // leave as is; browser will parse absolute/relative pairs
  });

  // Make non-anchor asset URLs absolute (scripts, images, sources, links)
  $("[src]").each((_, el) => {
    const $el = $(el);
    if (el.tagName?.toLowerCase() === "a") return;
    const src = $el.attr("src");
    if (src) $el.attr("src", abs(src)!);
  });
  $('link[href]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    if (href) $el.attr('href', abs(href)!);
  });

  // Keep navigation inside the Vercel site: rewrite WordPress-domain links to relative
  $("a[href]").each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href");
    if (!href) return;
    try {
      const u = new URL(href, WP_BASE);
      if (u.host === WP_HOST) {
        $a.attr("href", u.pathname + u.search + u.hash);
      }
    } catch {/* ignore */}
  });

  // Collect HEAD assets
  const headLinks: LinkAttrs[] = [];
  $("head link[rel=stylesheet]").each((_, el) => {
    const attrs: LinkAttrs = {};
    for (const { name, value } of el.attribs ? Object.entries(el.attribs).map(([name, value]) => ({ name, value })) : []) {
      if (value != null) attrs[name] = value;
    }
    if (attrs.href) headLinks.push(attrs);
  });

  const headStyleTags: string[] = [];
  $("head style").each((_, el) => headStyleTags.push($(el).html() || ""));

  const headScriptSrcs: string[] = [];
  const headInlineScripts: string[] = [];
  $("head script").each((_, el) => {
    const src = $(el).attr("src");
    if (src) headScriptSrcs.push(abs(src)!);
    else headInlineScripts.push($(el).html() || "");
  });

  // Collect BODY assets
  const bodyScriptSrcs: string[] = [];
  const bodyInlineScripts: string[] = [];
  $("body script").each((_, el) => {
    const src = $(el).attr("src");
    if (src) bodyScriptSrcs.push(abs(src)!);
    else bodyInlineScripts.push($(el).html() || "");
  });

  return {
    headLinks,
    headStyleTags,
    headScriptSrcs,
    headInlineScripts,
    bodyHtml: $("body").html() || "",
    bodyClass: $("body").attr("class") || "",
    bodyScriptSrcs,
    bodyInlineScripts,
  };
}
