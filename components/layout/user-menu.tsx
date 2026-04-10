"use client";

import * as React from "react";
import Link from "next/link";
import { User, Settings, LogOut, Sun, Bell } from "lucide-react";
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

interface UserMenuProps {
    user: {
        name: string | null;
        email: string | null;
        image?: string | null;
        role?: string;
    };
}

export function UserMenu({ user }: UserMenuProps) {
    const isMobile = useIsMobile();

    const handleLogout = async () => {
        await authClient.signOut();
    };

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
            {user.image && <AvatarImage src={user.image} alt={user.name || "User"} />}
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
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex items-center gap-3 px-2 pb-4 border-b border-border">
                            {Trigger}
                            <div className="flex flex-col">
                                <span className="text-sm font-medium leading-none">{user.name}</span>
                                <span className="text-xs text-muted-foreground mt-1">{user.email}</span>
                            </div>
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
                            
                            {/* Mobile Placeholders for Theme and Notification */}
                            <button className="flex items-center gap-3 px-2 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left">
                                <Sun className="h-4 w-4" />
                                <span>Alternar Tema</span>
                            </button>
                            <button className="flex items-center gap-3 px-2 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left">
                                <Bell className="h-4 w-4" />
                                <span>Notificações</span>
                            </button>
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
