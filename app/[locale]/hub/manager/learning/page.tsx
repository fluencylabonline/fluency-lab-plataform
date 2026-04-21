import { Header } from "@/components/layout/header";
import { Stepper } from "@/components/ui/stepper";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

export default async function LearningPage() {
    const user = await getCurrentUser();
    const locale = await getLocale();
    if (!user) redirect(`/${locale}/signin`);

    return (
        <main>
            <header>
                <Header title="Perfil" user={user} showSubHeader={false} />
            </header>
            <div>
                <Stepper
                    loading={false}
                    orientation="horizontal"
                    currentStep={2}
                    steps={[
                        { id: 1, title: 'Step 1', subtitle: 'Lookout flogging bilge rat main sheet' },
                        { id: 2, title: 'Step 2', subtitle: 'They urge you to put down your sword' },
                        { id: 3, title: 'Step 3', subtitle: 'Tell them I hate them. Is the Space Pope...' },
                    ]}
                />
            </div>
        </main>
    )
}