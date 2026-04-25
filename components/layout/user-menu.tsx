"use client";
import Link from "next/link";
import { User, Settings, LogOut } from "lucide-react";
import { useIsMobile } from "@/hooks/ui/use-device";
import { authClient } from "@/lib/auth-client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
    Vault,
    VaultContent,
    VaultHeader,
    VaultTitle,
    VaultTrigger,
} from "@/components/ui/vault";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAppearanceStore } from "@/modules/appearance/appearance.store";
import { useNotifications } from "@/hooks/notification/use-notifications";
import { NotificationList } from "@/modules/notification/_components/NotificationList";
import { Bell, Sun, Moon, Monitor, Check, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

interface UserMenuProps {
    user: {
        name: string | null;
        email: string | null;
        photoUrl?: string | null;
        role?: string;
    };
}

const LOCALES = [
    { id: "pt", name: "Português (BR)", flag: "🇧🇷" },
    { id: "en", name: "English", flag: "🇺🇸" },
];

export function UserMenu({ user }: UserMenuProps) {
    const isMobile = useIsMobile();
    const { setTheme } = useTheme();
    const { mode, setMode } = useAppearanceStore();
    const { notifications } = useNotifications();
    const locale = useLocale();
    const tCommon = useTranslations("Common");
    const tAuth = useTranslations("Auth");
    const router = useRouter();
    const pathname = usePathname();

    const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

    const handleLogout = async () => {
        await authClient.signOut();
    };

    const handleModeChange = (newMode: "light" | "dark" | "system") => {
        setMode(newMode);
        setTheme(newMode);
    };

    const toggleLocale = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale });
    };

    const modes = [
        { value: "light", label: tCommon("light"), icon: Sun },
        { value: "dark", label: tCommon("dark"), icon: Moon },
        { value: "system", label: tCommon("system"), icon: Monitor },
    ] as const;

    const menuItems = [
        { label: tCommon("profile"), icon: <User className="h-4 w-4" />, href: "#profile" },
        { label: tCommon("settings"), icon: <Settings className="h-4 w-4" />, href: "#settings" },
    ];

    const AvatarEl = (
        <Avatar size="xs" className="cursor-pointer border border-primary/50">
            {user.photoUrl && <AvatarImage src={user.photoUrl} alt={user.name || "User"} />}
            <AvatarFallback name={user.name || "U"} />
        </Avatar>
    );

    /* ─── Desktop (unchanged) ─── */
    if (!isMobile) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full bg-muted/50 ml-1 border border-border">
                        {AvatarEl}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {menuItems.map((item) => (
                        <DropdownMenuItem key={item.label} asChild>
                            <Link href={item.href} className="flex items-center">
                                <span className="mr-2">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Languages className="mr-2 h-4 w-4" />
                            <span>{tCommon("language")}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                {LOCALES.map((lang) => (
                                    <DropdownMenuItem key={lang.id} onClick={() => toggleLocale(lang.id)}>
                                        <div className="flex items-center w-full">
                                            <span className="mr-2">{lang.flag}</span>
                                            <span className="flex-1">{lang.name}</span>
                                            {locale === lang.id && <Check className="h-4 w-4 text-primary ml-2" />}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{tAuth("signOut")}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    /* ─── Mobile ─── */
    return (
        <Vault>
            <VaultTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-muted/50 ml-1 relative">
                    {AvatarEl}
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-background">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </VaultTrigger>

            <VaultContent>
                {/* User info */}
                <div className="flex items-center gap-3 px-1 pb-5 border-b border-border">
                    <Avatar size="sm" className="border border-border">
                        {user.photoUrl && <AvatarImage src={user.photoUrl} alt={user.name || "User"} />}
                        <AvatarFallback name={user.name || "U"} />
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold leading-tight">{user.name}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">{user.email}</span>
                    </div>
                </div>

                {/* Notification banner */}
                <Vault>
                    <VaultTrigger asChild>
                        <button className="w-full flex items-center justify-between px-3 py-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors mt-4">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Bell className="h-5 w-5 text-foreground" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium leading-tight">{tCommon("notifications")}</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        {unreadCount > 0 ? tCommon("unreadSuffix", { count: unreadCount }) : tCommon("allCaughtUp")}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-muted-foreground">›</span>
                        </button>
                    </VaultTrigger>
                    <VaultContent>
                        <VaultHeader>
                            <VaultTitle>{tCommon("notifications")}</VaultTitle>
                        </VaultHeader>
                        <div className="py-4">
                            <NotificationList />
                        </div>
                    </VaultContent>
                </Vault>

                {/* Appearance + Language as inline toggle rows */}
                <div className="mt-2 rounded-xl border border-border overflow-hidden divide-y divide-border">
                    {/* Appearance row */}
                    <div className="px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
                            {tCommon("appearance")}
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                            {modes.map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    onClick={() => handleModeChange(value)}
                                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${mode === value
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Language row */}
                    <div className="px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
                            {tCommon("language")}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {LOCALES.map((lang) => (
                                <button
                                    key={lang.id}
                                    onClick={() => toggleLocale(lang.id)}
                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${locale === lang.id
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                >
                                    <span className="text-base leading-none">{lang.flag}</span>
                                    <span>{lang.id === "pt" ? "PT" : "EN"}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Nav links */}
                <div className="mt-2 rounded-xl border border-border overflow-hidden divide-y divide-border">
                    {menuItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
                        >
                            <span className="text-muted-foreground">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* Logout */}
                <Button
                    variant="ghost"
                    className="w-full justify-start mt-3 text-destructive hover:text-destructive hover:bg-destructive/5"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    {tAuth("signOut")}
                </Button>
            </VaultContent>
        </Vault>
    );
}