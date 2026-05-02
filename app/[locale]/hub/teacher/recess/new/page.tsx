import { getLanguagesAction } from "@/modules/curriculum/curriculum.actions";
import { RecessActivityEditorClient } from "../_components/RecessActivityEditorClient";

export default async function NewRecessActivityPage() {
  const result = await getLanguagesAction({});
  const languages = result?.data || [];

  return (
    <RecessActivityEditorClient 
      languages={languages} 
    />
  );
}
