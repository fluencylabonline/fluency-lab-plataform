import { CalendarDaysIcon } from "@/components/animated-icons/calendar";
import { CircleCheckIcon } from "@/components/animated-icons/circle-check";
import { DollarSignIcon } from "@/components/animated-icons/finances";
import LayoutDashboardIcon from "@/components/animated-icons/layout-dashboard-icon";
import { LayoutPanelTopIcon } from "@/components/animated-icons/notebook";
import { BellIcon } from "@/components/animated-icons/notification";
import { PeopleIcon } from "@/components/animated-icons/people";
import { UserIcon } from "@/components/animated-icons/person";
import { SettingsIcon } from "@/components/animated-icons/settings";
import { ClapIcon } from "@/components/animated-icons/video";
import { WavesLadderIcon } from "@/components/animated-icons/waves-ladder";
import { MenuItemType } from "@/components/layout/types";
import { UserRoles, hasPermission, type UserRoleInfo } from "@/lib/rbac";
import { FileTextIcon } from "@/components/animated-icons/file-text";
import { MessageSquareIcon } from "@/components/animated-icons/message-square";

const adminItems: MenuItemType[] = [
    {
        href: "/admin/profile",
        label: "Meu Perfil",
        labelKey: "myProfile",
        Icon: UserIcon,
        iconProps: { size: 20 },
        permission: "profile.update.self",
    },
    {
        href: "/admin/dashboard",
        label: "Dashboard",
        labelKey: "dashboard",
        Icon: LayoutDashboardIcon,
        iconProps: { size: 20 },
        permission: "class.view.all",
    },
    {
        href: "/admin/users",
        label: "Usuários",
        labelKey: "users",
        Icon: PeopleIcon,
        iconProps: { size: 20 },
        permission: "user.create",
    },
    {
        href: "/admin/finances",
        label: "Financeiro",
        labelKey: "finances",
        Icon: DollarSignIcon,
        iconProps: { size: 20 },
        permission: "payment.manage",
    },
    
    {
        href: "/admin/contracts",
        label: "Contratos",
        labelKey: "contracts",
        Icon: FileTextIcon,
        iconProps: { size: 20 },
        permission: "payment.manage",
    },
    {
        href: "/admin/courses",
        label: "Cursos",
        labelKey: "courses",
        Icon: ClapIcon,
        iconProps: { size: 20 },
        permission: "material.view",
    },
    {
        href: "/admin/conversas",
        label: "Conversas",
        labelKey: "chat",
        Icon: MessageSquareIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/admin/communication",
        label: "Notificações",
        labelKey: "notifications",
        Icon: BellIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/admin/tasks",
        label: "Tarefas",
        labelKey: "tasks",
        Icon: CircleCheckIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/admin/settings",
        label: "Configurações",
        labelKey: "settings",
        Icon: SettingsIcon,
        iconProps: { size: 20 },
    },
];

const teacherItems: MenuItemType[] = [
    {
        href: "/teacher/profile",
        label: "Meu Perfil",
        labelKey: "myProfile",
        Icon: UserIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/teacher/students",
        label: "Alunos",
        labelKey: "students",
        Icon: PeopleIcon,
        iconProps: { size: 20 },
        permission: "class.view.assigned",
    },
    {
        href: "/teacher/schedule",
        label: "Minha Agenda",
        labelKey: "mySchedule",
        Icon: CalendarDaysIcon,
        iconProps: { size: 20 },
        permission: "class.view.assigned",
    },
    {
        href: "/teacher/lessons",
        label: "Lições",
        labelKey: "lessons",
        Icon: LayoutDashboardIcon,
        iconProps: { size: 20 },
        permission: "material.view",
    },
    {
        href: "/teacher/settings",
        label: "Configurações",
        labelKey: "settings",
        Icon: SettingsIcon,
        iconProps: { size: 20 },
    },
];

const studentItems: MenuItemType[] = [
    {
        href: "/student/profile",
        label: "Meu Perfil",
        labelKey: "myProfile",
        Icon: UserIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/student/notebook",
        label: "Caderno",
        labelKey: "notebook",
        Icon: LayoutPanelTopIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/student/schedule",
        label: "Calendário",
        labelKey: "calendar",
        Icon: CalendarDaysIcon,
        iconProps: { size: 20 },
        permission: "class.view",
    },
    {
        href: "/student/courses",
        label: "Cursos",
        labelKey: "courses",
        Icon: ClapIcon,
        iconProps: { size: 20 },
        permission: "material.view",
    },
    {
        href: "/student/immersion",
        label: "Imersão",
        labelKey: "immersion",
        Icon: WavesLadderIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/student/settings",
        label: "Configurações",
        labelKey: "settings",
        Icon: SettingsIcon,
        iconProps: { size: 20 },
    },
];

const managerItems: MenuItemType[] = [
    {
        href: "/manager/profile",
        label: "Meu Perfil",
        labelKey: "myProfile",
        Icon: UserIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/manager/users",
        label: "Usuários",
        labelKey: "users",
        Icon: PeopleIcon,
        iconProps: { size: 20 },
        permission: "student.support",
    },
    {
        href: "/manager/conversas",
        label: "Conversas",
        labelKey: "chat",
        Icon: MessageSquareIcon,
        iconProps: { size: 20 },
        permission: "student.support",
    },
    {
        href: "/manager/learning",
        label: "Aprendizado",
        labelKey: "learning",
        Icon: ClapIcon,
        iconProps: { size: 20 },
        permission: "material.view",
    },
    {
        href: "/manager/tasks",
        label: "Tarefas",
        labelKey: "tasks",
        Icon: CircleCheckIcon,
        iconProps: { size: 20 },
        permission: "report.view.limited",
    },
    {
        href: "/manager/settings",
        label: "Configurações",
        labelKey: "settings",
        Icon: SettingsIcon,
        iconProps: { size: 20 },
    },
];


// Mapeia os papéis para suas respectivas listas de itens
export const sidebarItemsByRole: Record<string, MenuItemType[]> = {
    [UserRoles.ADMIN]: adminItems,
    [UserRoles.MANAGER]: managerItems,
    [UserRoles.TEACHER]: teacherItems,
    [UserRoles.STUDENT]: studentItems,
};

// Helper to build locale-aware hrefs
function buildHrefWithLocale(href: string): string {
    if (!href) return href;
    // Replace explicit [locale] placeholder when present
    if (href.startsWith("/[locale]")) {
        return href.replace("/[locale]", `/hub`);
    }
    // Prefix root-based paths with locale
    if (href.startsWith("/")) {
        return `/hub${href}`;
    }
    // Leave relative or external URLs untouched
    return href;
}

// Public API: get items by role with locale-aware hrefs and permission filtering
export function getSidebarItemsByRole(
    user: UserRoleInfo,
): MenuItemType[] {
    const role = user.role;
    const raw = sidebarItemsByRole[role] || [];

    return raw
        .filter((item) => !item.permission || hasPermission(user, item.permission))
        .map((it) => ({
            ...it,
            href: buildHrefWithLocale(it.href),
            subItems: it.subItems
                ? it.subItems
                    .filter((sub) => !sub.permission || hasPermission(user, sub.permission))
                    .map((sub) => ({
                        ...sub,
                        href: buildHrefWithLocale(sub.href),
                    }))
                : undefined,
        }));
}
