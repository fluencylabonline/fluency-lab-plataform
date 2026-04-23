"use client";
import Link from "next/link";
import { User, Settings, LogOut } from "lucide-react";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { authClient } from "@/lib/auth-client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
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
import { Bell, Sun, Moon, Monitor, Check } from "lucide-react";

interface UserMenuProps {
    user: {
        name: string | null;
        email: string | null;
        photoUrl?: string | null;
        role?: string;
    };
}

export function UserMenu({ user }: UserMenuProps) {
    const isMobile = useIsMobile();
    const { setTheme } = useTheme();
    const { mode, setMode } = useAppearanceStore();
    const { notifications } = useNotifications();

    const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

    const handleLogout = async () => {
        await authClient.signOut();
    };

    const handleModeChange = (newMode: "light" | "dark" | "system") => {
        setMode(newMode);
        setTheme(newMode);
    };

    const modes = [
        { value: "light", label: "Claro", icon: Sun },
        { value: "dark", label: "Escuro", icon: Moon },
        { value: "system", label: "Sistema", icon: Monitor },
    ] as const;

    const menuItems = [
        {
            label: "Perfil",
            icon: <User className="mr-2 h-4 w-4" />,
            href: "#profile", // Placeholder
        },
        {
            label: "Configurações",
            icon: <Settings className="mr-2 h-4 w-4" />,
            href: "#settings", // Placeholder
        },
    ];

    const Trigger = (
        <Avatar size="xs" className="cursor-pointer border border-border">
            {user.photoUrl && <AvatarImage src={user.photoUrl} alt={user.name || "User"} />}
            <AvatarFallback name={user.name || "U"} />
        </Avatar>
    );

    if (isMobile) {
        return (
            <Vault>
                <VaultTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full bg-muted/50 ml-1">
                        {Trigger}
                    </Button>
                </VaultTrigger>
                <VaultContent>
                    <VaultHeader>
                        <VaultTitle>Minha Conta</VaultTitle>
                    </VaultHeader>
                    <div className="flex flex-col gap-6 py-4">
                        <div className="flex items-center gap-3 px-2 pb-4 border-b border-border">
                            {Trigger}
                            <div className="flex flex-col">
                                <span className="text-sm font-medium leading-none">{user.name}</span>
                                <span className="text-xs text-muted-foreground mt-1">{user.email}</span>
                            </div>
                        </div>

                        {/* Notificações e Tema (Mobile Only) */}
                        <div className="grid grid-cols-2 gap-3 px-2">
                            <Vault>
                                <VaultTrigger asChild>
                                    <Button variant="outline" className="flex flex-col h-20 gap-2 items-center justify-center relative">
                                        <Bell className="h-5 w-5" />
                                        <span className="text-xs font-medium mx-2">Notificações</span>
                                        {unreadCount > 0 && (
                                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                                {unreadCount > 9 ? "9+" : unreadCount}
                                            </span>
                                        )}
                                    </Button>
                                </VaultTrigger>
                                <VaultContent>
                                    <VaultHeader>
                                        <VaultTitle>Notificações</VaultTitle>
                                    </VaultHeader>
                                    <div className="py-4">
                                        <NotificationList />
                                    </div>
                                </VaultContent>
                            </Vault>

                            <Vault>
                                <VaultTrigger asChild>
                                    <Button variant="outline" className="flex flex-col h-20 gap-2 items-center justify-center">
                                        <div className="relative h-5 w-5">
                                            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                            <Moon className="absolute inset-0 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                        </div>
                                        <span className="text-xs font-medium">Aparência</span>
                                    </Button>
                                </VaultTrigger>
                                <VaultContent>
                                    <VaultHeader>
                                        <VaultTitle>Aparência</VaultTitle>
                                    </VaultHeader>
                                    <div className="grid gap-2 py-4">
                                        {modes.map(({ value, label, icon: Icon }) => (
                                            <Button
                                                key={value}
                                                variant={mode === value ? "secondary" : "ghost"}
                                                className="w-full justify-between h-12"
                                                onClick={() => handleModeChange(value)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon className="h-5 w-5" />
                                                    <span>{label}</span>
                                                </div>
                                                {mode === value && <Check className="h-4 w-4 text-primary ml-2" />}
                                            </Button>
                                        ))}
                                    </div>
                                </VaultContent>
                            </Vault>
                        </div>

                        <div className="grid gap-1">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="flex items-center gap-3 px-2 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        <Button
                            variant="destructive"
                            className="w-full justify-start mt-2"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair
                        </Button>
                    </div>
                </VaultContent>
            </Vault>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-muted/50 ml-1 border border-border">
                    {Trigger}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {menuItems.map((item) => (
                    <DropdownMenuItem key={item.label} asChild>
                        <Link href={item.href} className="flex items-center">
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
