// lib/fetchRendered.ts
import { load } from "cheerio";

const WP_BASE = process.env.WP_BASE || "https://unjabbed.app";

/** Fetch a fully-rendered WordPress page and return cleaned HTML */
export async function fetchRendered(pathname: string): Promise<string> {
  const url = new URL(pathname, WP_BASE).toString();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);

  const html = await res.text();
  const $ = load(html);

  $("#wpadminbar").remove();

  // rewrite href/src to absolute so assets resolve on Vercel
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.startsWith("/")) $(el).attr("href", new URL(href, WP_BASE).toString());
  });
  $("img[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src && src.startsWith("/")) $(el).attr("src", new URL(src, WP_BASE).toString());
  });

  return $("body").html() || "";
}
