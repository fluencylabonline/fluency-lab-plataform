"use client";

import { useState, useMemo, useEffect } from "react";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";
import SidebarItem from "./sidebar-item";
import VaultItem from "./vault-item";
import { VaultBar } from "./vaultbar";
import { MenuItemType } from "@/components/layout/types";
import { useCollapsedStore } from "./collapsed-store";
import { SidebarTrigger } from "./sidebar-trigger";
import { ArrowUp } from "lucide-react";
import Logo from "@/public/brand/logo.png";
import Image from "next/image";
import useSWR from "swr";
import { getWhatsAppUnreadCountAction } from "@/modules/communication/communication.actions";
import { rtdb } from "@/lib/firebase";
import { ref as dbRef, onValue } from "firebase/database";

export interface SidebarProps {
    items: MenuItemType[];
}

export const Sidebar: React.FC<SidebarProps> = ({ items }) => {
    const pathname = usePathname();
    const isCollapsed = useCollapsedStore((state) => state.isCollapsed);

    const { data: unreadData, mutate: mutateUnread } = useSWR(
        "whatsapp-unread-count",
        async () => {
            const res = await getWhatsAppUnreadCountAction();
            return res?.data?.count || 0;
        }
    );

    useEffect(() => {
        const signalRef = dbRef(rtdb, "whatsapp_sync_signal/conversations");
        const unsubscribe = onValue(signalRef, () => {
            mutateUnread();
        });
        return () => unsubscribe();
    }, [mutateUnread]);

    const itemsWithBadges = useMemo(() => {
        return items.map(item => {
            if (item.labelKey === "chat" || item.href.endsWith("/conversas")) {
                return {
                    ...item,
                    badgeCount: unreadData || 0
                };
            }
            return item;
        });
    }, [items, unreadData]);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileItems = useMemo(
        () => itemsWithBadges.filter((item) => !item.subItems),
        [itemsWithBadges],
    );


    //Para esconder a sidebar
    const isPracticeSession = pathname.includes("/hub/student/practice/session");
    if (isPracticeSession) return null;

    return (
        <>
            <motion.aside
                animate={{
                    width: isCollapsed ? 48 : 256,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="hidden md:flex flex-col items-center mx-auto lg:ml-2 max-h-full"
            > 
                <motion.div
                    layout
                    className={twMerge(
                        "flex flex-col w-full h-full",
                        !isCollapsed && "px-2 gap-3 pt-4",
                    )}
                >
                    <motion.nav
                        layout
                        className={twMerge(
                            "flex flex-col gap-2 flex-1",
                            isCollapsed && "w-fit items-center mt-4",
                            !isCollapsed && "w-full",
                        )}
                    >
                        <div className={twMerge(
                            "flex items-center mb-4 transition-all duration-300",
                            isCollapsed ? "justify-center" : "px-3 justify-between"
                        )}>
                            {!isCollapsed && <Image src={Logo} alt="Logo" width={140} style={{ height: "auto" }} priority /> }
                            <SidebarTrigger />
                        </div>

                        {itemsWithBadges.filter(item => item.labelKey !== "settings").map((item, index) => (
                            <motion.div
                                key={item.href}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <SidebarItem item={item} isCollapsed={isCollapsed} />
                            </motion.div>
                        ))}

                        <div className="mt-auto flex flex-col gap-2 mb-4">
                            {itemsWithBadges.filter(item => item.labelKey === "settings").map((item, index) => (
                                <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: (itemsWithBadges.length - 1 + index) * 0.05 }}
                                >
                                    <SidebarItem item={item} isCollapsed={isCollapsed} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.nav>
                </motion.div>
            </motion.aside>

            <motion.nav
                key="mobile-navbar"
                className="vault-bar-layout md:hidden fixed bottom-0 left-0 right-0 px-4 py-2 z-40 flex items-center justify-between"
            >
                <motion.div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center flex-1 min-w-0 overflow-x-auto no-scrollbar scroll-smooth gap-1">
                        {mobileItems.map((item) => (
                            <VaultItem key={item.label} item={item} />
                        ))}
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="relative flex items-center justify-center p-2 text-muted-foreground hover:text-primary transition-colors duration-200 shrink-0"
                    >
                        <div className="w-6 h-6 flex items-center justify-center">
                            <ArrowUp className="w-6 h-6" />
                        </div>
                    </motion.button>
                </motion.div>
            </motion.nav>

            <VaultBar
                open={isMobileMenuOpen}
                onOpenChange={setIsMobileMenuOpen}
                items={itemsWithBadges}
            />
        </>
    );
};