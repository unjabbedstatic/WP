// app/layout.tsx
import type { Metadata } from "next";
import fetchRendered from "../lib/fetchRendered";

export const metadata: Metadata = {
  title: "Unjabbed – Static Replica",
  description:
    "Pixel-perfect pages pulled from WordPress and served statically on Vercel.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pull the home page HEAD so we can inject its styles
  const { head, styles } = await fetchRendered("/");

  return (
    <html lang="en">
      {/* We avoid putting raw <head> HTML here because the app router can ignore it. */}
      <body suppressHydrationWarning>
        {/* 1) Inject stylesheets explicitly so CSS always loads */}
        {styles.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}

        {/* 2) Also dump the original <head> HTML in case there are useful metas (harmless in body) */}
        <div dangerouslySetInnerHTML={{ __html: head }} />

        {/* 3) Page content */}
        {children}
      </body>
    </html>
  );
}
