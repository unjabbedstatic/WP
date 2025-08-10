const WP_BASE = process.env.WP_BASE || "https://unjabbed.app";
const WP_HOST = new URL(WP_BASE).host;

// -------- keep assets absolute to WP --------
$("[src]").each((_, el) => {
  const src = $(el).attr("src");
  if (!src) return;
  // make assets absolute to WP so they load
  $(el).attr("src", new URL(src, WP_BASE).toString());
});

$("link[href]").each((_, el) => {
  const href = $(el).attr("href");
  if (!href) return;
  // keep stylesheets etc. absolute to WP
  $(el).attr("href", new URL(href, WP_BASE).toString());
});

// -------- make INTERNAL page links stay on Vercel --------
$("a[href]").each((_, el) => {
  const raw = $(el).attr("href");
  if (!raw) return;

  // Build an absolute URL relative to WP so we can inspect it
  let abs: URL;
  try { abs = new URL(raw, WP_BASE); } catch { return; }

  const isInternal =
    abs.host === WP_HOST && // same site
    !abs.pathname.match(/\.(pdf|jpg|jpeg|png|gif|webp|svg|zip|mp4|mp3)$/i); // not a file asset

  if (isInternal) {
    // Repoint to a path on the *current* domain so Next.js handles it
    const pathOnThisSite = abs.pathname + abs.search + abs.hash;
    $(el).attr("href", pathOnThisSite);
  } else {
    // external link – optional: open in new tab
    $(el).attr("rel", "noopener");
  }
});

// -------- forms should post back to WP --------
$("form[action]").each((_, el) => {
  const action = $(el).attr("action");
  if (!action) return;
  $(el).attr("action", new URL(action, WP_BASE).toString());
});
