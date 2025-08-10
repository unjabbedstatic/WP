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
  const { head, styles } = await fetchRendered("/");

  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {styles.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        <div dangerouslySetInnerHTML={{ __html: head }} />
        {children}
      </body>
    </html>
  );
}
