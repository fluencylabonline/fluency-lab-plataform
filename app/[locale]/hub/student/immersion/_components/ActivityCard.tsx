"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

interface ActivityCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  color: "blue" | "emerald" | "purple" | "orange" | "pink";
  comingSoon?: boolean;
  className?: string;
}

const colorMap = {
  blue: "from-blue-500/20 to-indigo-500/10 border-blue-500/20 hover:border-blue-500/40 text-blue-500",
  emerald: "from-emerald-500/20 to-teal-500/10 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-500",
  purple: "from-purple-500/20 to-violet-500/10 border-purple-500/20 hover:border-purple-500/40 text-purple-500",
  orange: "from-orange-500/20 to-amber-500/10 border-orange-500/20 hover:border-orange-500/40 text-orange-500",
  pink: "from-pink-500/20 to-rose-500/10 border-pink-500/20 hover:border-pink-500/40 text-pink-500",
};

export function ActivityCard({
  title,
  description,
  icon,
  href,
  color,
  comingSoon,
  className,
}: ActivityCardProps) {
  const Container = comingSoon ? "div" : Link;

  return (
    <motion.div
      whileHover={comingSoon ? {} : { y: -4 }}
      whileTap={comingSoon ? {} : { scale: 0.98 }}
      className={cn(
        "relative group overflow-hidden rounded-3xl border bg-linear-to-br transition-all duration-300",
        colorMap[color],
        comingSoon && "opacity-60 cursor-not-allowed grayscale-[0.5]",
        className
      )}
    >
      <Container
        href={href}
        className="flex flex-col p-6 h-full min-h-[160px] justify-between"
      >
        <div className="flex justify-between items-start">
          <div className="p-3 rounded-2xl bg-background/50 backdrop-blur-sm border border-current/10">
            {icon}
          </div>
          {comingSoon && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-background/80 px-2 py-1 rounded-full border border-current/20">
              Em breve
            </span>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>

        {!comingSoon && (
          <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            <ArrowRight className="w-5 h-5" />
          </div>
        )}
      </Container>
    </motion.div>
  );
}
