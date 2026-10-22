import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { MediaLibraryClient } from "./_components/MediaLibraryClient";

export default async function MediaLibraryPage() {
    const user = await getCurrentUser();
    const locale = await getLocale();

    if (!user) redirect(`/${locale}/signin`);
    if (user.role !== "manager" && user.role !== "admin") redirect(`/${locale}/hub`);

    return (
        <div>
            <Header
                title="Biblioteca de Mídia"
                subtitle="Gerencie seus arquivos de áudio e gere transcrições automáticas."
                backHref="/hub/manager/learning"
                className="contents"
            />

            <main className="container">
                <MediaLibraryClient />
            </main>
        </div>
    );
}
