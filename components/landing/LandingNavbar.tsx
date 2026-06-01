"use client";

import { useState, useEffect } from "react";
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
import { authClient } from "@/lib/auth-client";
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);

      const sections = ["about", "plans", "team", "faq"];
      const offset = 120;

      let currentSection = "";

      const isAtBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 10;

      if (isAtBottom) {
        currentSection = "faq";
      } else {
        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top <= offset) {
              currentSection = section;
            }
          }
        }
      }

      if (currentSection) {
        setActiveTab(currentSection);
      } else {
        setActiveTab("");
      }
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLoginClick = () => {
    if (user) {
      router.push("/hub");
    } else {
      router.push("/signin");
    }
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await authClient.signOut();
    // Redirect happens in authClient.signOut
  };

  const navLinksLeft = [
    { id: "about", label: t("nav.about") || "Sobre", href: "#about" },
    { id: "plans", label: t("nav.plans") || "Planos", href: "#plans" },
  ];

  const navLinksRight = [
    { id: "team", label: t("nav.team") || "Time", href: "#team" },
    { id: "faq", label: t("nav.faq") || "FAQ", href: "#faq" },
  ];

  const backgroundTransition = { duration: 0.3, ease: "easeInOut" as const };

  return (
    <>
      <LayoutGroup id="desktop-navbar">
        <motion.header
        className="hidden md:flex fixed top-0 left-0 w-full z-99 pointer-events-none flex-col items-center"
        animate={{
          paddingTop: isScrolled ? "1rem" : "2rem",
          paddingLeft: isScrolled ? "1rem" : "2rem",
          paddingRight: isScrolled ? "1rem" : "2rem",
        }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
      >
        <motion.div
          layout
          className="relative flex items-center pointer-events-auto"
          style={{ borderRadius: 9999 }}
          initial={{ width: "100%", justifyContent: "space-between" }}
          animate={{
            width: isScrolled ? "fit-content" : "100%",
            gap: isScrolled ? "8px" : "0px",
          }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: isScrolled ? 1 : 0 }}
            transition={backgroundTransition}
          />

          <motion.div
            layout="position"
            className="relative flex items-center gap-2 p-2 rounded-full transition-all duration-300"
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-white/20 dark:bg-white/5 shadow-xs -z-20"
              initial={{ opacity: 1 }}
              animate={{ opacity: isScrolled ? 0 : 1 }}
              transition={backgroundTransition}
            />

            <div className="relative z-10 flex items-center">
              <div className="flex items-center gap-3 pl-4 pr-2">
                <Image
                  src={Logo}
                  alt="Logo"
                  width={140}
                  style={{ height: "auto" }}
                  className="object-contain"
                />
              </div>
              <nav
                className={
                  isScrolled
                    ? "flex items-center gap-1 text-black dark:text-white"
                    : "flex items-center gap-1 text-white"
                }
              >
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
          </motion.div>

          {!isScrolled && <motion.div layout className="flex-grow" />}

          <motion.div
            layout
            className="relative flex items-center gap-2 p-2 rounded-full"
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-white/20 dark:bg-white/5 shadow-xs -z-20"
              initial={{ opacity: 1 }}
              animate={{ opacity: isScrolled ? 0 : 1 }}
              transition={backgroundTransition}
            />

            <div className="relative z-10 flex items-center gap-2">
              <nav
                className={
                  isScrolled
                    ? "flex items-center gap-1 text-black dark:text-white"
                    : "flex items-center gap-1 text-white"
                }
              >
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
                  layout
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLoginClick}
                  disabled={isLoggingOut}
                  className={`z-10 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 min-h-[44px] whitespace-nowrap disabled:opacity-50 ${
                    isScrolled
                      ? "text-black dark:text-white"
                      : "text-white"
                  }`}
                >
                  {isLoggingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : user ? (
                    <>
                      <span className="whitespace-nowrap">
                        {t("nav.continue") || "Continuar"}
                      </span>
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={user.photoUrl || undefined} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                    </>
                  ) : (
                    <>
                      <span className={isScrolled ? "text-black dark:text-white" : "text-white"}>
                        {t("nav.login") || "Entrar"}
                      </span>
                      <DoorOpenIcon className={isScrolled ? "w-4 h-4 text-black dark:text-white" : "w-4 h-4 text-white"} />
                    </>
                  )}
                </motion.button>

                <AnimatePresence>
                  {user && (
                    <motion.button
                      layout
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
          </motion.div>
        </motion.div>
      </motion.header>
      </LayoutGroup>

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
          className="bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-foreground px-4 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2"
        >
          {user ? (
            <>
              <span>{t("nav.continue") || "Continuar"}</span>
              <Avatar className="w-6 h-6">
                <AvatarImage src={user.photoUrl || undefined} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
            </>
          ) : (
            <>
              <span className="whitespace-nowrap text-white dark:text-white">{t("nav.login") || "Entrar"}</span>
              <DoorOpenIcon className="w-4 h-4 text-white dark:text-white" />
            </>
          )}
        </button>
      </header>

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
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
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
            color:
              activeTab === id
                ? "#ffffff" // active: always white (pill is dark)
                : isScrolled
                  ? isDark
                    ? "#ffffff" // scrolled + dark mode
                    : "#000000" // scrolled + light mode
                  : "#dfdfdf", // not scrolled: over hero image, always light
          }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.span>
      </span>
    </Link>
  );
}
