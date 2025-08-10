export const metadata = {
  title: "Unjabbed – Static Replica",
  description: "Pixel-perfect pages pulled from WordPress and served statically on Vercel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
