// app/[...slug]/page.tsx
import fetchRendered from "../../lib/fetchRendered";

export const dynamic = "force-static";
export const revalidate = 3600;

type Props = { params: { slug?: string[] } };

export default async function Page({ params }: Props) {
  const path = params.slug?.length ? `/${params.slug.join("/")}` : "/";

  const { bodyHtml /*, bodyClass*/ } = await fetchRendered(path);

  // You can add className={bodyClass} to <main> if you want WP body classes.
  return <main dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}
