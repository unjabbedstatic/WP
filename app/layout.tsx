// app/layout.tsx
import type { ReactNode } from "react";
import fetchRendered from "../lib/fetchRendered";

export const dynamic = "force-static";
export const revalidate = 3600;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { headHtml, bodyClass } = await fetchRendered("/");
  return (
    <html lang="en">
      <head dangerouslySetInnerHTML={{ __html: headHtml }} />
      <body className={bodyClass}>{children}</body>
    </html>
  );
}
