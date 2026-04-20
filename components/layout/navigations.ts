import { CalendarDaysIcon } from "@/components/animated-icons/calendar";
import { CircleCheckIcon } from "@/components/animated-icons/circle-check";
import { DollarSignIcon } from "@/components/animated-icons/finances";
import LayoutDashboardIcon from "@/components/animated-icons/layout-dashboard-icon";
import { MessageSquareIcon } from "@/components/animated-icons/message-square";
import { LayoutPanelTopIcon } from "@/components/animated-icons/notebook";
import { BellIcon } from "@/components/animated-icons/notification";
import { PeopleIcon } from "@/components/animated-icons/people";
import { UserIcon } from "@/components/animated-icons/person";
import { SettingsIcon } from "@/components/animated-icons/settings";
import { ClapIcon } from "@/components/animated-icons/video";
import { WavesLadderIcon } from "@/components/animated-icons/waves-ladder";
import { MenuItemType } from "@/components/layout/types";
import { UserRoles, hasPermission, type UserRoleInfo } from "@/lib/rbac";

const adminItems: MenuItemType[] = [
    {
        href: "/[locale]/hub/admin/my-profile",
        label: "Meu Perfil",
        labelKey: "myProfile",
        Icon: UserIcon,
        iconProps: { size: 20 },
        permission: "profile.update.self",
    },
    {
        href: "/[locale]/hub/admin/dashboard",
        label: "Dashboard",
        labelKey: "dashboard",
        Icon: LayoutDashboardIcon,
        iconProps: { size: 20 },
        permission: "class.view.all",
    },
    {
        href: "/[locale]/hub/admin/users",
        label: "Usuários",
        labelKey: "users",
        Icon: PeopleIcon,
        iconProps: { size: 20 },
        permission: "user.create",
    },
    {
        href: "/[locale]/hub/admin/finances",
        label: "Financeiro",
        labelKey: "finances",
        Icon: DollarSignIcon,
        iconProps: { size: 20 },
        permission: "payment.manage",
    },
    {
        href: "/[locale]/hub/admin/courses",
        label: "Cursos",
        labelKey: "courses",
        Icon: ClapIcon,
        iconProps: { size: 20 },
        permission: "material.view",
    },
    {
        href: "/[locale]/hub/admin/notification",
        label: "Notificações",
        labelKey: "notifications",
        Icon: BellIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/[locale]/hub/admin/tasks",
        label: "Tarefas",
        labelKey: "tasks",
        Icon: CircleCheckIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/[locale]/hub/admin/settings",
        label: "Configurações",
        labelKey: "settings",
        Icon: SettingsIcon,
        iconProps: { size: 20 },
    },
];

const teacherItems: MenuItemType[] = [
    {
        href: "/[locale]/hub/teacher/my-profile",
        label: "Meu Perfil",
        labelKey: "myProfile",
        Icon: UserIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/[locale]/hub/teacher/my-students",
        label: "Alunos",
        labelKey: "students",
        Icon: PeopleIcon,
        iconProps: { size: 20 },
        permission: "class.view.assigned",
    },
    {
        href: "/[locale]/hub/teacher/my-schedule",
        label: "Minha Agenda",
        labelKey: "mySchedule",
        Icon: CalendarDaysIcon,
        iconProps: { size: 20 },
        permission: "class.view.assigned",
    },
    {
        href: "/[locale]/hub/teacher/workbooks",
        label: "Material",
        labelKey: "workbooks",
        Icon: LayoutDashboardIcon,
        iconProps: { size: 20 },
        permission: "material.view",
    },
    {
        href: "/[locale]/hub/teacher/my-chat",
        label: "Conversas",
        labelKey: "chat",
        Icon: MessageSquareIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/[locale]/hub/teacher/settings",
        label: "Configurações",
        labelKey: "settings",
        Icon: SettingsIcon,
        iconProps: { size: 20 },
    },
];

const studentItems: MenuItemType[] = [
    {
        href: "/[locale]/hub/student/my-profile",
        label: "Meu Perfil",
        labelKey: "myProfile",
        Icon: UserIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/[locale]/hub/student/my-notebook",
        label: "Caderno",
        labelKey: "notebook",
        Icon: LayoutPanelTopIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/[locale]/hub/student/my-classes",
        label: "Calendário",
        labelKey: "calendar",
        Icon: CalendarDaysIcon,
        iconProps: { size: 20 },
        permission: "class.view",
    },
    {
        href: "/[locale]/hub/student/my-courses",
        label: "Cursos",
        labelKey: "courses",
        Icon: ClapIcon,
        iconProps: { size: 20 },
        permission: "material.view",
    },
    {
        href: "/[locale]/hub/student/my-immersion",
        label: "Imersão",
        labelKey: "immersion",
        Icon: WavesLadderIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/[locale]/hub/student/my-chat",
        label: "Conversas",
        labelKey: "chat",
        Icon: MessageSquareIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/[locale]/hub/student/settings",
        label: "Configurações",
        labelKey: "settings",
        Icon: SettingsIcon,
        iconProps: { size: 20 },
    },
];

const managerItems: MenuItemType[] = [
    {
        href: "/[locale]/hub/manager/my-profile",
        label: "Meu Perfil",
        labelKey: "myProfile",
        Icon: UserIcon,
        iconProps: { size: 20 },
    },
    {
        href: "/[locale]/hub/manager/students",
        label: "Estudantes",
        labelKey: "students",
        Icon: PeopleIcon,
        iconProps: { size: 20 },
        permission: "student.support",
    },
    {
        href: "/[locale]/hub/manager/tasks",
        label: "Tarefas",
        labelKey: "tasks",
        Icon: CircleCheckIcon,
        iconProps: { size: 20 },
        permission: "report.view.limited",
    },
    {
        href: "/[locale]/hub/manager/settings",
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
