import { fetchRendered } from "../lib/fetchRendered";

export const dynamic = "force-static";


export default async function Page() {
  const html = await fetchRendered("/");
  return <main dangerouslySetInnerHTML={{ __html: html }} />;
}
