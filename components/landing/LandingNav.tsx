"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { DoorOpenIcon, Loader2, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "@/public/brand/logo.png";
import { cn } from "@/lib/utils";
import type { SessionUserDTO } from "@/modules/user/user.schema";

const LINKS = [
  ["howItWorks", "diferenciais"],
  ["placement", "nivelamento"],
  ["pricing", "agenda"],
] as const;

/** Barra fixa em pílula. O link da seção que está na tela ganha um destaque que desliza entre os itens. */
export function LandingNav({ user }: { user: SessionUserDTO | null }) {
  const t = useTranslations("LandingShowcase");
  const [active, setActive] = useState<string>("aula");
  const [hover, setHover] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      const { authClient } = await import("@/lib/auth-client");
      await authClient.signOut();
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
      setIsLoggingOut(false);
    }
  };

  // As seções abaixo da dobra carregam depois (dynamic), então o elemento é procurado a cada scroll:
  // vale a seção que cruza uma linha a ~40% da altura da janela.
  useEffect(() => {
    const ids = ["aula", ...LINKS.map(([, id]) => id), "agendar"];
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.4;
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) current = id;
      }
      if (current) setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const timer = setTimeout(update, 1500); // depois que as seções dinâmicas montarem
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header className="fixed top-3 md:top-6 inset-x-0 z-50 px-3 md:px-8 pointer-events-none">
      <div className="mx-auto max-w-5xl flex items-center justify-between gap-3 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md pl-5 pr-2 py-2 pointer-events-auto">
        <a href="#aula" aria-label={t("Nav.homeLabel")}><Image src={Logo} alt={t("Common.brand")} width={120} style={{ height: "auto" }} priority /></a>
        <nav aria-label={t("Nav.sectionsLabel")} className="hidden lg:flex items-center gap-1">
          {LINKS.map(([key, id]) => {
            const on = active === id;
            return (
              <a key={id} href={`#${id}`} aria-current={on ? "true" : undefined} className={cn("relative rounded-full px-3 py-2 text-sm font-medium transition-colors", on ? "text-primary" : "text-foreground/70 hover:text-foreground")}>
                {on && <motion.span layoutId="nav-active-pill" transition={{ type: "spring", stiffness: 380, damping: 32 }} className="absolute inset-0 rounded-full bg-primary/10" />}
                <span className="relative">{t(`Nav.${key}`)}</span>
              </a>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <div className="flex items-center" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href={user ? "/hub" : "/signin"}
                aria-disabled={isLoggingOut}
                className={cn("flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-full bg-black/5 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20", isLoggingOut && "pointer-events-none opacity-50")}
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : user ? (
                  <>
                    <span>{t("Nav.continue")}</span>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.photoUrl || undefined} />
                      <AvatarFallback name={user.name}>{user.name[0]}</AvatarFallback>
                    </Avatar>
                  </>
                ) : (
                  <>
                    <span>{t("Nav.login")}</span>
                    <DoorOpenIcon className="h-4 w-4" />
                  </>
                )}
              </Link>
            </motion.div>
            <AnimatePresence>
              {user && hover && !isLoggingOut && (
                <motion.button
                  type="button"
                  aria-label={t("Nav.signOut")}
                  initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                  animate={{ width: 44, opacity: 1, marginLeft: 8 }}
                  exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  className="flex min-h-[44px] items-center justify-center overflow-hidden rounded-full bg-rose-300/40 text-rose-700 hover:bg-rose-500/40 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40"
                >
                  <LogOut size={18} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <a href="#agendar" className={cn("rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors", active === "agendar" ? "bg-primary/80 text-primary-foreground ring-2 ring-primary/30" : "bg-primary text-primary-foreground")}>{t("Common.cta")}</a>
        </div>
      </div>
    </header>
  );
}
