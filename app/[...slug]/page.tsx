// app/[...slug]/page.tsx
import fetchRendered from "../../lib/fetchRendered";

export const dynamic = "force-static";
export const revalidate = 3600;

type Props = { params: { slug: string[] } };

export default async function CatchAll({ params }: Props) {
  const path = "/" + params.slug.join("/");

  // If your fetchRendered returns { bodyHtml }:
  const { bodyHtml } = await fetchRendered(path);
  return <main dangerouslySetInnerHTML={{ __html: bodyHtml }} />;

  // If fetchRendered returns a plain string instead, use this:
  // const html = await fetchRendered(path);
  // return <main dangerouslySetInnerHTML={{ __html: html }} />;
}
