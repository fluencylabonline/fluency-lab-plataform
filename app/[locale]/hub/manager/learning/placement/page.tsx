import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { curriculumService } from "@/modules/curriculum/curriculum.service";
import { placementService } from "@/modules/placement/placement.service";
import { PlacementClient } from "./_components/PlacementClient";

export default async function PlacementManagerPage() {
    const user = await getCurrentUser();
    const locale = await getLocale();

    if (!user) redirect(`/${locale}/signin`);
    if (user.role !== "manager" && user.role !== "admin") redirect(`/${locale}/hub`);

    const languages = await curriculumService.findAllLanguages();
    const defaultLangId = languages[0]?.id;
    
    const initialStats = defaultLangId 
        ? await placementService.getStats(defaultLangId) 
        : { byStatus: [], byLevel: [] };

    return (
        <PlacementClient 
            user={user} 
            languages={languages} 
            initialStats={initialStats} 
        />
    );
}
