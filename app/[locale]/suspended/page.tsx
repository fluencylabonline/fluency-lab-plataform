import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { SuspendedContent } from "./_components/SuspendedContent";
import { settingsService } from "@/modules/settings/settings.service";

export default async function SuspendedPage() {
    const user = await getCurrentUser();

    // Se não estiver logado, manda pro signin
    if (!user) {
        redirect("/signin");
    }

    // Se o usuário estiver ativo, não deve estar aqui
    if (user.isActive) {
        redirect("/hub");
    }

    // Mesmo número de contato da landing e da Central de Ajuda (configurações do admin).
    let whatsappNumber: string | null = null;
    try {
        const settings = await settingsService.getSettings();
        whatsappNumber = settings.whatsappNumber?.replace(/\D/g, "") || null;
    } catch (error) {
        console.error("[SuspendedPage] Falha ao carregar o WhatsApp de contato:", error);
    }

    return (
        <div className="min-h-dvh w-full bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements for premium feel */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-violet-500/5 blur-[120px]" />
            </div>

            <SuspendedContent whatsappNumber={whatsappNumber} />
        </div>
    );
}
