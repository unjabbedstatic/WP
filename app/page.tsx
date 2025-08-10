// app/page.tsx
import fetchRendered from "../lib/fetchRendered";

export const dynamic = "force-static";

export default async function Page() {
  const { body } = await fetchRendered("/");
  // body MUST be a string and we MUST pass { __html: body }
  return <main dangerouslySetInnerHTML={{ __html: body }} />;
}
