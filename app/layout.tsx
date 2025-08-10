// app/layout.tsx
import type { ReactNode } from "react";

export const dynamic = "force-static";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
