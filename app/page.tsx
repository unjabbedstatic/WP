// app/page.tsx
import fetchRendered from "../lib/fetchRendered";

export const dynamic = "force-static";
export const revalidate = 3600;

export default async function Page() {
  const { bodyHtml } = await fetchRendered("/");
  return <main dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}
