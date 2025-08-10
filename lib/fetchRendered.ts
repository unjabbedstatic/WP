// lib/fetchRendered.ts
const WP_BASE = process.env.WP_BASE ?? "https://unjabbed.app";

export type Rendered = {
  headHtml: string;
  bodyHtml: string;
  bodyClass?: string;
};

/**
 * Fetch a fully-rendered WordPress page and split out <head> and <body>.
 */
export default async function fetchRendered(pathname: string): Promise<Rendered> {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = new URL(path, WP_BASE).toString();

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      // Helps WP serve normal HTML (not admin/REST/etc)
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();

  // Grab <head>...</head>
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headHtml = headMatch?.[1] ?? "";

  // Grab <body ...>...</body>
  const bodyMatch = html.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch?.[2] ?? html;

  // Pull body class (useful but optional)
  let bodyClass = "";
  if (bodyMatch?.[1]) {
    const cls = bodyMatch[1].match(/class=["']([^"']*)["']/i);
    bodyClass = cls?.[1] ?? "";
  }

  return { headHtml, bodyHtml, bodyClass };
}
