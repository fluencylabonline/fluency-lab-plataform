import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth-server";
import { Sidebar } from "@/components/layout/sidebar";
import { getSidebarItemsByRole } from "@/components/layout/navigations";
import { UserRoles } from "@/lib/rbac";

interface HubLayoutProps {
  children: React.ReactNode;
}

export default async function HubLayout({ children }: HubLayoutProps) {
  const user = await getCurrentUser();
  const locale = await getLocale();

  // 1. Portoiro Severo: Validate session and active status
  if (!user) {
    redirect(`/${locale}/signin`);
  }

  if (!user.isActive) {
    // If user is authenticated but not active, they shouldn't be here
    // In a real scenario, redirect to a "Suspended" page or similar
    redirect(`/${locale}/signin?error=suspended`);
  }

  // 2. Prepare Navigation Items
  const role = (user.role as UserRoles) || UserRoles.STUDENT;
  const menuItems = getSidebarItemsByRole(role, locale);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      {/* Persistent Sidebar (Desktop) / Bottom Vault (Mobile) */}
      <Sidebar items={menuItems} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* 
            Content wrapper with adaptive padding:
            Bottom padding is larger on mobile to avoid overlapping with the Bottom Vault/Navbar
          */}
          <div className="container mx-auto p-4 md:p-6 pb-24 md:pb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
