// app/page.tsx
import fetchRendered from "../lib/fetchRendered";

export const dynamic = "force-dynamic"; // render at request time

export default async function Page() {
  const { body } = await fetchRendered("/");
  return <main dangerouslySetInnerHTML={{ __html: body }} />;
}
