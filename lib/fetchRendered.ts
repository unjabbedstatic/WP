// lib/fetchRendered.ts
import { load } from "cheerio";

const WP_BASE = process.env.WP_BASE || "https://unjabbed.app";

/** Fetch a fully-rendered WordPress page and return HTML with styles included */
export async function fetchRendered(pathname: string): Promise<string> {
  const url = new URL(pathname, WP_BASE).toString();
  const res = await fetch(url); // server-side fetch at build time
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);

  const html = await res.text();
  const $ = load(html);

  // Remove admin bar if present
  $("#wpadminbar").remove();

  // Helper: absolutize URLs that start with "/"
  const absolutize = (v?: string | null) =>
    v && v.startsWith("/") ? new URL(v, WP_BASE).toString() : v ?? undefined;

  // Build a list of stylesheet tags from <head>
  const styles: string[] = [];
  $("head link[rel='stylesheet']").each((_, el) => {
    const href = absolutize($(el).attr("href"));
    if (href) styles.push(`<link rel="stylesheet" href="${href}" />`);
  });
  // Inline styles (keep as-is)
  $("head style").each((_, el) => {
    styles.push($(el).toString());
  });

  // Fix relative URLs inside BODY (href/src starting with "/")
  const body = $("body");
  body.find("[href]").each((_, el) => {
    const href = absolutize($(el).attr("href"));
    if (href) $(el).attr("href", href);
  });
  body.find("[src]").each((_, el) => {
    const src = absolutize($(el).attr("src"));
    if (src) $(el).attr("src", src);
  });

  const bodyHtml = body.html() ?? html; // fallback
  // Return styles FIRST so the page is styled, then the body markup
  return `${styles.join("\n")}\n${bodyHtml}`;
}
