import { DocsPageContent } from "@/modules/docs/_components/DocsPageContent";
import { pageTitle } from "@/lib/page-metadata";

export const generateMetadata = pageTitle("helpCenter");

export default async function DocsPage() {
  return <DocsPageContent />;
}
