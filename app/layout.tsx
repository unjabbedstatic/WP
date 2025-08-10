// app/layout.tsx
import type { Metadata } from "next";
import fetchRendered from "../lib/fetchRendered";

export const metadata: Metadata = {
  title: "Unjabbed – Static Replica",
  description: "Pixel-perfect pages pulled from WordPress and served statically on Vercel.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { head, styles, bodyClass } = await fetchRendered("/");

  return (
    <html lang="en">
      <head dangerouslySetInnerHTML={{ __html: head }} />
      <body className={bodyClass} suppressHydrationWarning>
        {styles.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        {children}
      </body>
    </html>
  );
}
