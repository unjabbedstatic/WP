// lib/fetchRendered.ts
import { load } from "cheerio";

const WP_BASE = process.env.WP_BASE || "https://unjabbed.app";

/**
 * Fetch a fully-rendered WordPress page and return cleaned HTML.
 * We also move stylesheet <link> and <style> tags from <head> into the top of <body>
 * so the page looks identical when rendered by Next.js.
 */
export default async function fetchRendered(pathname: string): Promise<string> {
  const url = new URL(pathname, WP_BASE).toString();
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = load(html);

  // Remove WP admin bar if present
  $("#wpadminbar").remove();

  // Build absolute URLs for assets and internal links
  // href
  $("[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    // protocol-relative //example.com -> https://example.com
    if (href.startsWith("//")) $(el).attr("href", `https:${href}`);
    // site-relative /path -> https://unjabbed.app/path
    else if (href.startsWith("/")) $(el).attr("href", new URL(href, WP_BASE).toString());
  });

  // src
  $("[src]").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src.startsWith("//")) $(el).attr("src", `https:${src}`);
    else if (src.startsWith("/")) $(el).attr("src", new URL(src, WP_BASE).toString());
  });

  // Also fix CSS url(...) inside inline <style> tags (common for fonts/images)
  $("style").each((_, el) => {
    const css = $(el).html() || "";
    // url(/path.png)  -> url(https://unjabbed.app/path.png)
    const patched = css.replace(/url\((['"]?)(\/[^)'"\s]+)\1\)/g, (_m, q, p) => `url(${q}${new URL(p, WP_BASE).toString()}${q})`);
    $(el).html(patched);
  });

  // >>> IMPORTANT PART <<<
  // Collect styles from <head> and inject at the top of <body>
  const headStyles = $("head link[rel='stylesheet'], head style")
    .toArray()
    .map((el) => $.html(el))
    .join("\n");

  $("body").prepend(headStyles);

  // Return the body HTML (now including the styles)
  return $("body").html() || "";
}
