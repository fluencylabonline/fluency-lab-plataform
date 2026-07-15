"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/brand/logo.png";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { DoorOpenIcon, LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BottomSheetIcon } from "@/components/animated-icons/bottom-sheet";
import { User } from "@/modules/user/user.schema";
import {
  Vault,
  VaultTrigger,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultBody,
} from "@/components/ui/vault";
import { LanguageSwitcher } from "../ui/language-switcher";
import { ThemeSwitcher } from "../ui/theme-switcher";

// GSAP Imports
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

interface LandingNavbarProps {
  user: User | null;
}

export function LandingNavbar({ user }: LandingNavbarProps) {
  const t = useTranslations("LandingPage");
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { resolvedTheme } = useTheme();

  // Refs para o GSAP
  const headerRef = useRef<HTMLElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const leftNavRef = useRef<HTMLDivElement>(null);
  const rightNavRef = useRef<HTMLDivElement>(null);
  
  const leftBgRef = useRef<HTMLDivElement>(null);
  const rightBgRef = useRef<HTMLDivElement>(null);
  const mainBgRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!navContainerRef.current || !leftNavRef.current || !rightNavRef.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "+=200", // Distância de scroll para o merge completo
          scrub: 1, // Fluidez natural
          invalidateOnRefresh: true, // Recalcula se o usuário redimensionar a tela
          onUpdate: (self) => {
            // Troca a cor dos textos nos últimos 20% da animação (quando ocorre a colisão)
            setIsScrolled(self.progress > 0.8);
          },
        },
      });

      // 1. Reduz os paddings do header (USANDO APENAS .to PARA RESPEITAR O CSS ORIGINAL)
      tl.to(
        headerRef.current,
        { paddingTop: "1rem", paddingLeft: "1rem", paddingRight: "1rem", duration: 1, ease: "power2.inOut" },
        0
      );

      // 2. A MÁGICA: O Container vai da sua largura natural no CSS para a soma exata dos dois lados + 8px de gap.
      tl.to(
        navContainerRef.current,
        { 
          width: () => `${leftNavRef.current!.offsetWidth + rightNavRef.current!.offsetWidth + 8}px`, 
          gap: "8px",
          duration: 1, 
          ease: "power2.inOut" 
        },
        0
      );

      // 3. O Fundo Centralizado surge apenas na colisão (últimos 20% do timeline)
      tl.to(
        [leftBgRef.current, rightBgRef.current],
        { opacity: 0, duration: 0.2, ease: "power1.inOut" },
        0.8
      );

      tl.to(
        mainBgRef.current,
        { opacity: 1, duration: 0.2, ease: "power1.inOut" },
        0.8
      );
    },
    { dependencies: [resolvedTheme, user, t] } // Refaz o cálculo se as palavras mudarem de tamanho
  );

  // Lógica de Abas com Intersection Observer
  useEffect(() => {
    const sections = ["about", "plans", "team", "faq"];
    const observerOptions = { root: null, rootMargin: "-40% 0px -50% 0px", threshold: 0 };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveTab(entry.target.id);
      });
      if (window.scrollY < 100) setActiveTab("");
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    const handleScrollBottom = () => {
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
      if (isAtBottom) setActiveTab("faq");
    };

    window.addEventListener("scroll", handleScrollBottom, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScrollBottom);
      observer.disconnect();
    };
  }, []);

  const handleLoginClick = () => {
    if (user) router.push("/hub");
    else router.push("/signin");
  };

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

  const navLinksLeft = [
    { id: "about", label: t("nav.about") || "Sobre", href: "#about" },
    { id: "plans", label: t("nav.plans") || "Planos", href: "#plans" },
  ];

  const navLinksRight = [
    { id: "team", label: t("nav.team") || "Time", href: "#team" },
    { id: "faq", label: t("nav.faq") || "FAQ", href: "#faq" },
  ];

  return (
    <>
      <LayoutGroup id="desktop-navbar">
        <header
          ref={headerRef}
          className="hidden md:flex fixed top-0 left-0 w-full z-[99] pointer-events-none flex-col items-center pt-[2rem] px-[2rem]"
        >
          <div
            ref={navContainerRef}
            className="relative flex items-center justify-between pointer-events-auto rounded-full w-full"
          >
            {/* Fundo Central (agora atrelado apenas à largura deste container) */}
            <div
              ref={mainBgRef}
              className="absolute inset-0 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md -z-10 opacity-0"
            />

            {/* ----- LADO ESQUERDO ----- */}
            <div ref={leftNavRef} className="relative flex items-center gap-2 p-2 rounded-full shrink-0">
              <div
                ref={leftBgRef}
                className="absolute inset-0 rounded-full bg-black/60 dark:bg-white/5 shadow-xs -z-20"
              />

              <div className="relative z-10 flex items-center">
                <div className="flex items-center gap-3 pl-4 pr-2">
                  <Image src={Logo} alt="Logo" width={140} style={{ height: "auto" }} className="object-contain" />
                </div>
                <nav className={`flex items-center gap-1 transition-colors duration-200 ${isScrolled ? "text-black dark:text-white" : "text-white"}`}>
                  {navLinksLeft.map((link) => (
                    <NavItem
                      key={link.id}
                      id={link.id}
                      label={link.label}
                      href={link.href}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      isScrolled={isScrolled}
                      isDark={resolvedTheme === "dark"}
                    />
                  ))}
                </nav>
              </div>
            </div>

            {/* ----- LADO DIREITO ----- */}
            <div ref={rightNavRef} className="relative flex items-center gap-2 p-2 rounded-full shrink-0">
              <div
                ref={rightBgRef}
                className="absolute inset-0 rounded-full bg-black/60 dark:bg-white/5 shadow-xs -z-20"
              />

              <div className="relative z-10 flex items-center gap-2">
                <nav className={`flex items-center gap-1 transition-colors duration-200 ${isScrolled ? "text-black dark:text-white" : "text-white"}`}>
                  {navLinksRight.map((link) => (
                    <NavItem
                      key={link.id}
                      id={link.id}
                      label={link.label}
                      href={link.href}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      isScrolled={isScrolled}
                      isDark={resolvedTheme === "dark"}
                    />
                  ))}
                </nav>

                <div className="flex items-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLoginClick}
                    disabled={isLoggingOut}
                    className={`z-10 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 min-h-[44px] whitespace-nowrap disabled:opacity-50 transition-colors duration-200 ${
                      isScrolled
                        ? "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-black dark:text-white"
                        : "bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 text-white"
                    }`}
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : user ? (
                      <>
                        <span className="whitespace-nowrap">{t("nav.continue") || "Continuar"}</span>
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={user.photoUrl || undefined} />
                          <AvatarFallback name={user.name}>{user.name[0]}</AvatarFallback>
                        </Avatar>
                      </>
                    ) : (
                      <>
                        <span>{t("nav.login") || "Entrar"}</span>
                        <DoorOpenIcon className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {user && (
                      <motion.button
                        initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                        animate={{ width: 44, opacity: 1, marginLeft: 8 }}
                        exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSignOut}
                        className="bg-rose-300/40 dark:bg-rose-900/20 hover:bg-rose-500/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 rounded-full flex items-center justify-center overflow-hidden min-h-[44px]"
                      >
                        <LogOut size={18} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </header>
      </LayoutGroup>

      {/* HEADER MOBILE E MENU VAULT MANTIDOS INTACTOS AQUI... */}
      <header className="md:hidden w-full p-4 flex justify-between items-center z-40 relative">
        <div className="w-36">
          <Image
            src={Logo}
            alt="Logo"
            width={144}
            style={{ height: "auto" }}
            className="object-contain"
          />
        </div>

        <button
          onClick={handleLoginClick}
          className="bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 text-white px-4 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          {user ? (
            <>
              <span className="text-white">
                {t("nav.continue") || "Continuar"}
              </span>
              <Avatar className="w-6 h-6">
                <AvatarImage src={user.photoUrl || undefined} />
                <AvatarFallback name={user.name}>{user.name[0]}</AvatarFallback>
              </Avatar>
            </>
          ) : (
            <>
              <span className="whitespace-nowrap text-white">
                {t("nav.login") || "Entrar"}
              </span>
              <DoorOpenIcon className="w-4 h-4 text-white" />
            </>
          )}
        </button>
      </header>

      {/* ---------- MENU MOBILE (VAULT) ---------- */}
      <Vault open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <div className="md:hidden fixed bottom-6 left-6 z-50">
          <VaultTrigger asChild>
            <button
              aria-label="Abrir menu de navegação"
              className="w-14 h-14 bg-black text-primary rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
            >
              <BottomSheetIcon size={24} />
            </button>
          </VaultTrigger>
        </div>

        <VaultContent className="md:hidden">
          <VaultHeader>
            <div className="flex items-center justify-center gap-2">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
            <VaultTitle>{t("nav.menu") || "Menu"}</VaultTitle>
          </VaultHeader>
          <VaultBody className="p-8 pb-10">
            <nav className="flex flex-col gap-4">
              {[...navLinksLeft, ...navLinksRight].map((link) => (
                <Link
                  key={`mobile-${link.id}`}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-medium text-gray-700 dark:text-gray-200 py-4 border-b border-gray-100 dark:border-gray-800"
                >
                  {link.label}
                </Link>
              ))}

              <button
                onClick={handleLoginClick}
                className="mt-6 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                {user ? (
                  <>
                    <span>{t("nav.continue") || "Continuar"}</span>
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={user.photoUrl || undefined} />
                      <AvatarFallback name={user.name}>{user.name[0]}</AvatarFallback>
                    </Avatar>
                  </>
                ) : (
                  t("nav.login") || "Entrar"
                )}
              </button>

              {user && (
                <button
                  onClick={handleSignOut}
                  className="mt-4 w-full text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors py-2"
                >
                  {t("nav.signOut") || "Sair da conta"}
                </button>
              )}
            </nav>
          </VaultBody>
        </VaultContent>
      </Vault>
    </>
  );
}

function NavItem({
  id,
  label,
  href,
  activeTab,
  setActiveTab,
  isScrolled,
  isDark,
}: {
  id: string;
  label: string;
  href: string;
  activeTab: string;
  setActiveTab: (id: string) => void;
  isScrolled: boolean;
  isDark: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={() => setActiveTab(id)}
      className="relative px-6 py-3 rounded-full text-sm font-medium outline-none focus-visible:ring-2 whitespace-nowrap"
    >
      {activeTab === id && (
        <motion.div
          layoutId="nav-pill"
          className="absolute inset-0 bg-gray-900 dark:bg-stone-950"
          style={{ borderRadius: 9999 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <span className="relative z-10">
        <motion.span
          animate={{
            color: activeTab === id ? "#ffffff" : isScrolled ? (isDark ? "#ffffff" : "#000000") : "#dfdfdf",
          }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.span>
      </span>
    </Link>
  );
}