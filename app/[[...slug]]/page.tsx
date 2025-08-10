// app/[[...slug]]/page.tsx
import fetchRendered from "../../lib/fetchRendered";

export const dynamic = "force-static";
export const revalidate = 3600;

type Props = { params: { slug?: string[] } };

export default async function CatchAll({ params }: Props) {
  const path = params?.slug?.length ? `/${params.slug.join("/")}` : "/";
  const { bodyHtml } = await fetchRendered(path);
  return <main dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}
