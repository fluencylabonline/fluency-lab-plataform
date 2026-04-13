"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserMenu } from "./user-menu";
import { ThemeSwitcher } from "../ui/theme-switcher";
import { NotificationBell } from "@/modules/notification/_components/NotificationBell";

export interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    subtitle?: string;
    backHref?: string;
    onSearchChange?: (value: string) => void;
    actionButton?: React.ReactNode;
    showSubHeader?: boolean;
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
    actionButton,
    showSubHeader = true,
    user,
    className,
    ...props
}, ref) => {
    const isMobile = useIsMobile();
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

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

    return (
        <div ref={ref} className={cn("w-full flex flex-col", className)} {...props}>
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
                                {backHref && (
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
                                        {actionButton}
                                        <NotificationBell />
                                        {user && <UserMenu user={user} />}
                                    </>
                                ) : (
                                    <>
                                        <ThemeSwitcher />
                                        <NotificationBell />
                                        {user && <UserMenu user={user} />}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {showSubHeader && (
                <div className="sub-header-layout flex px-4 py-4 md:px-6 w-full">
                    {isMobile ? (
                        <div className="flex flex-col w-full">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between w-full min-h-[40px] gap-4">
                            <div className="flex-1 truncate">
                                {subtitle && (
                                    <p className="text-sm md:text-base text-muted-foreground truncate">
                                        {subtitle}
                                    </p>
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
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            autoFocus
                                                            value={searchValue}
                                                            onChange={handleSearch}
                                                            placeholder="Buscar..."
                                                            className="pl-9 pr-10 w-full rounded-full bg-muted/50"
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
                                                        variant="outline"
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
                                    {actionButton}
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