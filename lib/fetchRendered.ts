// lib/fetchRendered.ts
import { load } from "cheerio";

const WP_BASE = process.env.WP_BASE || "https://unjabbed.app";

/**
 * Fetch a fully-rendered WordPress page and return cleaned fragments
 * we can drop into our Next.js layout and pages.
 */
export default async function fetchRendered(
  path: string = "/"
): Promise<{ bodyHtml: string; headHtml: string; bodyClass: string }> {
  const url = new URL(path, WP_BASE).toString();

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = load(html);

  // Remove WP admin UI if present
  $("#wpadminbar, #wp-toolbar").remove();

  // Fix relative links and assets so they still work on Vercel
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    if (href.startsWith("/")) $(el).attr("href", new URL(href, WP_BASE).toString());
  });

  $("[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    if (src.startsWith("/")) $(el).attr("src", new URL(src, WP_BASE).toString());
  });

  $("link[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    if (href.startsWith("/")) $(el).attr("href", new URL(href, WP_BASE).toString());
  });

  const bodyHtml = $("body").html() ?? "";
  const headHtml = $("head").html() ?? "";
  const bodyClass = $("body").attr("class") ?? "";

  return { bodyHtml, headHtml, bodyClass };
}
