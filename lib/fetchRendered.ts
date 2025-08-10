// lib/fetchRendered.ts
import * as cheerio from "cheerio";

const WP_BASE = process.env.WP_BASE || "https://unjabbed.app";
const WP_HOST = new URL(WP_BASE).host;

export default async function fetchRendered(
  pathname: string
): Promise<{ bodyHtml: string }> {
  const url = new URL(pathname || "/", WP_BASE).toString();

  const res = await fetch(url, {
    cache: "no-store",
    headers: { "user-agent": "Vercel-Renderer" },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove WP admin bar if present
  $("#wpadminbar").remove();

  // Make asset URLs absolute to WP so CSS/JS/images load
  $("[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src) $(el).attr("src", new URL(src, WP_BASE).toString());
  });
  $("link[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href) $(el).attr("href", new URL(href, WP_BASE).toString());
  });

  // Keep internal page navigation on the Vercel domain
  $("a[href]").each((_, el) => {
    const raw = $(el).attr("href");
    if (!raw) return;
    let abs: URL;
    try {
      abs = new URL(raw, WP_BASE);
    } catch {
      return;
    }
    const isInternal =
      abs.host === WP_HOST &&
      !abs.pathname.match(/\.(pdf|jpe?g|png|gif|webp|svg|zip|mp4|mp3|css|js)$/i);

    if (isInternal) {
      $(el).attr("href", abs.pathname + abs.search + abs.hash);
    }
  });

  // Forms should still POST to WP
  $("form[action]").each((_, el) => {
    const action = $(el).attr("action");
    if (action) $(el).attr("action", new URL(action, WP_BASE).toString());
  });

  const bodyHtml = $("body").html() ?? html;
  return { bodyHtml };
}
