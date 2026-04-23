import { Header } from "@/components/layout/header";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth-server";

export default async function LearningAnalyticsPage() {
    const t = await getTranslations("Learning");
    const user = await getCurrentUser();
    if (!user) {
        return null;
    }
    return (
        <main className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-transparent">
            <Header
                title={t("analytics") || "Learning Analytics"}
                subtitle="Performance and engagement metrics for curriculum paths."
                user={user}
                backHref="/hub/manager/learning"
            />

            <div className="container max-w-7xl mx-auto px-4 py-8 md:px-6">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mb-4 text-amber-600">
                        <div className="w-8 h-8 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Learning Analytics coming soon</h2>
                    <p className="text-muted-foreground max-w-sm">
                        Dashboard for tracking student progress, completion rates, and curriculum performance.
                    </p>
                </div>
            </div>
        </main>
    );
}
