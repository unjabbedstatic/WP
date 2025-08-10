// app/[[...slug]]/page.tsx
import fetchRendered from "../../lib/fetchRendered";

export const dynamic = "force-static";
export const revalidate = 3600; // rebuild this path at most once per hour

type Props = { params: { slug?: string[] } };

export default async function CatchAll({ params }: Props) {
  // Build the WP path: "/" for home, otherwise "/about", "/news/post", etc.
  const path =
    params.slug && params.slug.length > 0 ? `/${params.slug.join("/")}` : "/";

  const html = await fetchRendered(path);
  return <main dangerouslySetInnerHTML={{ __html: html }} />;
}
