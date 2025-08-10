// app/layout.tsx
import type { ReactNode } from "react";
import fetchRendered from "../lib/fetchRendered";
import ScriptLoader from "./ScriptLoader";

export const dynamic = "force-static";
export const revalidate = 3600;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { head, bodyClass, styles, scripts } = await fetchRendered("/");

  return (
    <html lang="en">
      <head dangerouslySetInnerHTML={{ __html: head }} />
      <body className={bodyClass} suppressHydrationWarning>
        {/* Ensure CSS is definitely loaded */}
        {styles.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}

        {/* Make WP scripts run (needed for FAQ accordions, etc.) */}
        <ScriptLoader srcs={scripts} />

        {children}
      </body>
    </html>
  );
}
