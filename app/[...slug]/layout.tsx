// app/[...slug]/layout.tsx
import type { ReactNode } from "react";
import fetchRendered from "../../lib/fetchRendered";

export const dynamic = "force-static";
export const revalidate = 3600;

type Props = {
  children: ReactNode;
  params: { slug?: string[] };
};

export default async function SlugLayout({ children, params }: Props) {
  const path = params.slug?.length ? `/${params.slug.join("/")}` : "/";
  const { headHtml, bodyClass } = await fetchRendered(path);

  return (
    <html lang="en">
      <head dangerouslySetInnerHTML={{ __html: headHtml }} />
      <body className={bodyClass}>{children}</body>
    </html>
  );
}
