// lib/fetchRendered.ts
const WP_BASE = process.env.WP_BASE ?? "https://unjabbed.app";
const WP_HOST = new URL(WP_BASE).host;

export type Rendered = {
  headHtml: string;
  bodyHtml: string;
  bodyClass?: string;
};

export default async function fetchRendered(pathname: string): Promise<Rendered> {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = new URL(path, WP_BASE).toString();

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);

  let html = await res.text();

  // Extract <head> and <body>
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
  const headHtml = headMatch?.[1] ?? "";
  let bodyHtml = bodyMatch?.[2] ?? html;

  // Capture WordPress body classes (themes rely on these)
  let bodyClass = "";
  if (bodyMatch?.[1]) {
    const cls = bodyMatch[1].match(/class=["']([^"']*)["']/i);
    bodyClass = cls?.[1] ?? "";
  }

  // --- Keep navigation inside the Vercel app ---
  // Convert <a href="https://unjabbed.app/whatever"> → <a href="/whatever">
  // Handles http/https and host with/without www
  const hrefToInternal = new RegExp(
    String.raw`href=(['"])(?:https?:)?\/\/(?:www\.)?${WP_HOST}(\/[^'"]*)\1`,
    "gi"
  );
  bodyHtml = bodyHtml.replace(hrefToInternal, 'href="$2"');

  // Special case: links pointing exactly to the root
  const rootToSlash = new RegExp(
    String.raw`href=(['"])(?:https?:)?\/\/(?:www\.)?${WP_HOST}\/?\1`,
    "gi"
  );
  bodyHtml = bodyHtml.replace(rootToSlash, 'href="/"');

  return { headHtml, bodyHtml, bodyClass };
}
