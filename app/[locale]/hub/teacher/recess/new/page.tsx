import { getLanguagesAction } from "@/modules/curriculum/curriculum.actions";
import { RecessActivityEditorClient } from "../_components/RecessActivityEditorClient";
import { pageTitle } from "@/lib/page-metadata";

export const generateMetadata = pageTitle("newRecess");

export default async function NewRecessActivityPage() {
  const result = await getLanguagesAction({});
  const languages = result?.data || [];

  return (
    <RecessActivityEditorClient 
      languages={languages} 
    />
  );
}
