"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/ui/use-device";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserMenu } from "./user-menu";
import { ThemeSwitcher } from "../ui/theme-switcher";
import { NotificationBell } from "@/modules/notification/_components/NotificationBell";
import { SearchBar } from "../ui/search-bar";
import { useUserStore } from "@/modules/user/user.store";

export interface HeaderAction {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
}

export interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    subtitle?: string;
    backHref?: string;
    onSearchChange?: (value: string) => void;
    action?: HeaderAction;
    showSubHeader?: boolean;
    showHeader?: boolean;
    user?: {
        name: string | null;
        email: string | null;
        photoUrl?: string | null;
        role?: string;
    };
}

const Header = React.forwardRef<HTMLDivElement, HeaderProps>(({
    title,
    subtitle,
    backHref,
    onSearchChange,
    action,
    showSubHeader = true,
    showHeader = true,
    user,
    className,
    ...props
}, ref) => {
    const { user: storeUser, hasHydrated } = useUserStore();
    const isMobile = useIsMobile();
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    // Use prop user if provided, otherwise fallback to store user after hydration
    const displayUser = user || (hasHydrated ? (storeUser as any) : null);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchValue(val);
        onSearchChange?.(val);
    };

    const closeSearch = () => {
        setIsSearchOpen(false);
        setSearchValue("");
        onSearchChange?.("");
    };

    const renderAction = (isMobileSlot: boolean) => {
        if (!action) return null;

        if (action) {
            const button = (
                <Button
                    onClick={action.onClick}
                    variant={isMobileSlot ? "ghost" : "default"}
                    size={isMobileSlot ? "icon" : "default"}
                >
                    <p className="mr-1">{action.icon}</p>
                    {!isMobileSlot && <span>{action.label}</span>}
                </Button>
            );

            return button;
        }

        return null;
    };

    return (
        <div ref={ref} className={cn("w-full flex flex-col", className)} {...props}>
            {showHeader && (
                <header className="header-layout sticky top-0 z-40 flex h-14 w-full items-center justify-between px-4 md:px-6">
                    <AnimatePresence mode="wait">
                        {isMobile && isSearchOpen ? (
                            <motion.div
                                key="mobile-search"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex w-full items-center gap-2 h-full"
                            >
                                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                                <Input
                                    autoFocus
                                    value={searchValue}
                                    onChange={handleSearch}
                                    placeholder="Buscar..."
                                    className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 px-1 text-base"
                                />
                                <Button variant="ghost" size="icon" onClick={closeSearch} className="shrink-0">
                                    <X className="h-5 w-5" />
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="normal-header"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex w-full items-center justify-between h-full"
                            >
                                <div className="flex items-center w-1/4 sm:w-1/3">
                                    {backHref ? (
                                        <Link
                                            href={backHref}
                                            className={buttonVariants({
                                                variant: "ghost",
                                                size: "icon",
                                                className: "shrink-0 -ml-2 rounded-full",
                                            })}
                                        >
                                            <ArrowLeft className="h-5 w-5" />
                                            <span className="sr-only">Voltar</span>
                                        </Link>
                                    ) : (
                                        isMobile ? renderAction(true) : null
                                    )}
                                </div>

                                {!isMobile && (
                                    <div className="flex w-2/4 sm:w-1/3 justify-center items-center overflow-hidden">
                                        <h1 className="text-lg font-semibold tracking-tight truncate">
                                            {title}
                                        </h1>
                                    </div>
                                )}

                                <div className="flex w-3/4 sm:w-1/3 items-center justify-end gap-1 sm:gap-2">
                                    {isMobile ? (
                                        <>
                                            {onSearchChange && (
                                                <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
                                                    <Search className="h-5 w-5" />
                                                </Button>
                                            )}
                                            {backHref ? renderAction(true) : null}
                                            {displayUser && <UserMenu user={displayUser} />}
                                        </>
                                    ) : (
                                        <>
                                            <ThemeSwitcher />
                                            <NotificationBell />
                                            {displayUser && <UserMenu user={displayUser} />}
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </header>
            )}

            {showSubHeader && (
                <div className="sub-header-layout flex px-4 py-4 md:px-6 w-full">
                    {isMobile ? (
                        <div className="flex flex-col w-full">
                            <h1 className="text-xl font-bold tracking-tight text-foreground">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-sm text-muted-foreground">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between w-full min-h-[40px] gap-4">
                            <div className="flex-1 truncate">
                                {subtitle && (
                                    <div className="flex flex-row items-center gap-2">
                                        <div className="min-w-[5px] h-[20px] bg-primary rounded-lg" />
                                        <p className="text-sm md:text-lg text-text truncate ">{subtitle}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {onSearchChange && (
                                    <div className="relative flex items-center justify-end h-10">
                                        <AnimatePresence initial={false}>
                                            {isSearchOpen ? (
                                                <motion.div
                                                    key="desktop-search-input"
                                                    initial={{ width: 40, opacity: 0 }}
                                                    animate={{ width: 250, opacity: 1 }}
                                                    exit={{ width: 40, opacity: 0 }}
                                                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                                    className="flex items-center"
                                                >
                                                    <div className="relative w-full">
                                                        <SearchBar
                                                            autoFocus
                                                            value={searchValue}
                                                            onChange={handleSearch}
                                                            placeholder="Buscar..."
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-transparent"
                                                            onClick={closeSearch}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="desktop-search-button"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full"
                                                        onClick={() => setIsSearchOpen(true)}
                                                    >
                                                        <Search className="h-4 w-4" />
                                                    </Button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                <div className={cn("transition-all duration-300", isSearchOpen && subtitle ? "hidden lg:block" : "block")}>
                                    {renderAction(false)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

Header.displayName = "Header";

export { Header };