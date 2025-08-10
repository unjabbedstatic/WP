// lib/fetchRendered.ts
import { load } from "cheerio";

const WP_BASE = process.env.WP_BASE || "https://unjabbed.app";

/**
 * Fetch a fully-rendered WordPress page and return cleaned HTML.
 */
export async function fetchRendered(pathname: string): Promise<string> {
  const url = new URL(pathname, WP_BASE).toString();
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = load(html);

  // Remove WP admin toolbar if it appears
  $("#wpadminbar").remove();

  // Make all root-relative hrefs absolute (so they work on Vercel)
  $("[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    if (href.startsWith("/")) {
      $(el).attr("href", new URL(href, WP_BASE).toString());
    }
  });

  // Make all root-relative srcs absolute (images, scripts, etc.)
  $("[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    if (src.startsWith("/")) {
      $(el).attr("src", new URL(src, WP_BASE).toString());
    }
  });

  // Return just the body content so we can drop it into Next
  const bodyHtml = $("body").html() ?? "";
  return `<div id="wp-body">${bodyHtml}</div>`;
}
