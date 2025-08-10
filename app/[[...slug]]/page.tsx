// app/[[...slug]]/page.tsx
import fetchRendered from "../../lib/fetchRendered";

export const dynamic = "force-static";
export const revalidate = 3600;

type Props = {
  params: { slug?: string[] };
};

export default async function CatchAllPage({ params }: Props) {
  const path =
    params.slug && params.slug.length > 0 ? `/${params.slug.join("/")}` : "/";

  const { html } = await fetchRendered(path);

  return <main dangerouslySetInnerHTML={{ __html: html }} />;
}
