// app/page.tsx
import fetchRendered from "../lib/fetchRendered";

export const dynamic = "force-static";

export default async function Page() {
  const { bodyHtml } = await fetchRendered("/");
  return <main dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}
