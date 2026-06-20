"use client";

import { isPathActive } from "@/utils/pathname";
import { MenuItemType } from "@/components/layout/types";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

interface VaultItemProps {
  item: MenuItemType;
}

export default function VaultItem({
  item,
}: VaultItemProps) {
  const t = useTranslations("Navigation");
  const pathname = usePathname();
  const isActive = isPathActive(pathname, item.href);

  if (item.subItems) {
    return null;
  }

  const Icon = item.Icon;
  const iconNode = Icon ? <Icon {...(item.iconProps ?? {})} /> : item.icon;

  return (
    <Link
      href={item.href}
      className={twMerge(
        "flex flex-1 min-w-[80px] shrink-0",
        isActive && "min-w-max"
      )}
    >
      <motion.div
        whileTap={{ scale: 0.9 }}
        className={twMerge(
          "relative flex items-center justify-center transition-colors duration-200 w-full h-full",
          isActive
            ? "bg-primary/15 rounded-full px-4 py-2 gap-2"
            : "p-2 text-muted-foreground hover:text-primary",
        )}
      >
        <motion.div
          animate={isActive ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
          className="w-6 h-6 flex items-center justify-center text-primary"
        >
          {iconNode}
        </motion.div>
        <AnimatePresence>
          {isActive && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="text-sm font-medium text-foreground whitespace-nowrap overflow-hidden ml-2"
            >
              {item.labelKey ? t(item.labelKey) : item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
}
