"use client";
import { useState } from "react";

import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

import { Vault, VaultContent } from "@/components/ui/vault";
import { isPathActive } from "@/utils/pathname";
import { MenuItemType } from "@/components/layout/types";

import { ArrowDown } from "lucide-react";
import Link from "next/link";

export interface VaultBarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: MenuItemType[];
}

export const VaultBar: React.FC<VaultBarProps> = ({
    open,
    onOpenChange,
    items,
}) => {
    const t = useTranslations("Navigation");
    const pathname = usePathname();
    const [openSection, setOpenSection] = useState<string | null>(null);

    const [prevPathname, setPrevPathname] = useState(pathname);

    if (pathname !== prevPathname) {
        setPrevPathname(pathname);
        const activeSection = items.find((item) =>
            item.subItems?.some((sub) => isPathActive(pathname, sub.href)),
        );
        if (activeSection) {
            setOpenSection(activeSection.label);
        }
    }

    return (
        <Vault open={open} onOpenChange={onOpenChange}>
            <VaultContent
                noPadding={true}
                className="h-[85vh] max-h-[85vh] flex flex-col p-0"
            >
                <div className="flex items-center justify-center border-b border-border/50 shrink-0 px-4 py-4">
                    <h2 className="text-base font-semibold text-foreground">{t("menuDescription")}</h2>
                </div>

                <div className="overflow-y-auto flex-1 p-0 no-scrollbar">
                    <nav className="p-4 pb-8">
                        <ul className="space-y-2">
                            {items.map((item, index) => {
                                const Icon = item.Icon as React.ElementType | undefined;
                                const iconNode = Icon ? (
                                    <Icon {...(item.iconProps ?? {})} />
                                ) : (
                                    item.icon
                                );

                                return (
                                    <motion.li
                                        key={item.label}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        {item.subItems ? (
                                            <div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setOpenSection(
                                                            openSection === item.label ? null : item.label
                                                        )
                                                    }
                                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-5 h-5 flex items-center justify-center text-muted-foreground">
                                                            {iconNode}
                                                        </div>
                                                        <span className="font-medium text-foreground">
                                                            {item.labelKey ? t(item.labelKey) : item.label}
                                                        </span>
                                                    </div>
                                                    <motion.div
                                                        animate={{
                                                            rotate: openSection === item.label ? 180 : 0,
                                                        }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                                                    </motion.div>
                                                </button>

                                                <AnimatePresence>
                                                    {openSection === item.label && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="ml-6 mt-2 space-y-1 border-l-2 border-border pl-4 overflow-hidden"
                                                        >
                                                            {item.subItems.map((subItem, subIndex) => {
                                                                const isActive = isPathActive(pathname, subItem.href);

                                                                return (
                                                                    <motion.div
                                                                        key={subItem.href}
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ delay: subIndex * 0.05 }}
                                                                    >
                                                                        <Link
                                                                            href={subItem.href}
                                                                            onClick={() => onOpenChange(false)}
                                                                            className={twMerge(
                                                                                "flex items-center gap-3 p-2 rounded-lg transition-colors",
                                                                                isActive
                                                                                    ? "bg-muted text-foreground font-medium"
                                                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                                            )}
                                                                        >
                                                                            <div className="w-4 h-4 flex items-center justify-center">
                                                                                {subItem.icon}
                                                                            </div>
                                                                            <span className="text-sm">
                                                                                {subItem.labelKey ? t(subItem.labelKey) : subItem.label}
                                                                            </span>
                                                                        </Link>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ) : (
                                            <Link
                                                href={item.href}
                                                onClick={() => onOpenChange(false)}
                                                className={twMerge(
                                                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                                                    isPathActive(pathname, item.href)
                                                        ? "bg-muted text-foreground font-medium"
                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                )}
                                            >
                                                <div className="w-5 h-5 flex items-center justify-center">
                                                    {iconNode}
                                                </div>
                                                <span className="font-medium">
                                                    {item.labelKey ? t(item.labelKey) : item.label}
                                                </span>
                                            </Link>
                                        )}
                                    </motion.li>
                                );
                            })}
                        </ul>
                    </nav>
                </div>
            </VaultContent>
        </Vault>
    );
};