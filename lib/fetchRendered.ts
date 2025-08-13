// lib/fetchRendered.ts
import * as cheerio from "cheerio";

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

  const html = await res.text();

  // Use cheerio to parse and manipulate the HTML
  const $ = cheerio.load(html);

  // --- Remove the Tidio chat widget ---
  $('script[src*="code.tidio.co"]').remove();

  // --- Make asset paths absolute ---
  $("body img, body script").each((i, el) => {
    const src = $(el).attr("src");
    if (src && src.startsWith("/")) {
      $(el).attr("src", `${WP_BASE}${src}`);
    }

    const srcset = $(el).attr("srcset");
    if (srcset) {
      const newSrcset = srcset
        .split(",")
        .map((part) => {
          const [url, size] = part.trim().split(" ");
          if (url.startsWith("/")) {
            return `${WP_BASE}${url} ${size}`;
          }
          return part;
        })
        .join(", ");
      $(el).attr("srcset", newSrcset);
    }
  });

  // --- Keep navigation inside the Vercel app ---
  $("body a").each((i, el) => {
    const href = $(el).attr("href");
    if (href) {
      try {
        const linkUrl = new URL(href);
        if (linkUrl.host === WP_HOST) {
          $(el).attr("href", linkUrl.pathname);
        }
      } catch (e) {
        // Not a full URL, so it's a relative path, leave it as is
      }
    }
  });

  // Extract the final <head> and <body> content
  const headHtml = $("head").html() ?? "";
  const bodyHtml = $("body").html() ?? "";
  const bodyClass = $("body").attr("class") ?? "";

  return { headHtml, bodyHtml, bodyClass };
}
