// app/layout.tsx
import Script from "next/script";
import fetchRendered from "../lib/fetchRendered";
import ScriptLoader from "./ScriptLoader";

export const dynamic = "force-static";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const r = await fetchRendered("/");

  return (
    <html lang="en">
      <head suppressHydrationWarning>
        {/* WordPress styles from <head> */}
        {r.headLinks.map((attrs, i) => (
          // eslint-disable-next-line @next/next/no-css-tags
          <link key={`hl-${i}`} {...attrs} />
        ))}
        {r.headStyleTags.map((css, i) => (
          <style key={`hs-${i}`} dangerouslySetInnerHTML={{ __html: css }} />
        ))}

        {/* Order-sensitive head scripts (e.g., jQuery before plugins) */}
        {r.headScriptSrcs.map((src, i) => (
          <Script key={`hss-${i}`} src={src} strategy="beforeInteractive" />
        ))}
        {r.headInlineScripts.map((code, i) => (
          <Script
            key={`his-${i}`}
            id={`head-inline-${i}`}
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: code }}
          />
        ))}
      </head>

      <body className={r.bodyClass} suppressHydrationWarning>
        {/* Load body scripts in order, then inline ones */}
        <ScriptLoader srcs={r.bodyScriptSrcs} />
        {r.bodyInlineScripts.map((code, i) => (
          <Script key={`bis-${i}`} id={`body-inline-${i}`} strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: code }} />
        ))}

        {children}
      </body>
    </html>
  );
}
