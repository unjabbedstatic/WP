// app/layout.tsx
import type { ReactNode } from "react";
import fetchRendered from "../lib/fetchRendered";

export const dynamic = "force-static";
export const revalidate = 3600; // rebuild at most once per hour

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { head, bodyClass } = await fetchRendered("/");

  return (
    <html lang="en">
      {/* Inject WP <head> so all CSS/JS/fonts load */}
      <head dangerouslySetInnerHTML={{ __html: head }} />
      <body className={bodyClass}>{children}</body>
    </html>
  );
}
