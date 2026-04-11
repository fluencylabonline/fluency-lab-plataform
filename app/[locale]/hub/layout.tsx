import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { getSidebarItemsByRole } from "@/components/layout/navigations";
import { UserRoles } from "@/lib/rbac";

interface HubLayoutProps {
    children: React.ReactNode;
}

export default async function HubLayout({ children }: HubLayoutProps) {
    const user = await getCurrentUser();

    if (!user) {
        redirect(`/signin`);
    }

    if (!user.isActive) {
        redirect(`/signin?error=suspended`); // TODO: Implementar página de suspensão
    }

    const role = user.role as UserRoles;
    const menuItems = getSidebarItemsByRole(role);

    return (
        <div className="flex h-dvh w-full overflow-hidden bg-background">
            <Sidebar items={menuItems} />
            <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden text-foreground">
                <Header title="Hub" user={user ?? undefined} />
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
}