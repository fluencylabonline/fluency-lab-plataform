"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/brand/logo.png";
import { ArrowUp, MessageCircle, AtSign } from "lucide-react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notify } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "../ui/theme-switcher";
import { LanguageSwitcher } from "../ui/language-switcher";
import { motion } from "framer-motion";

const newsletterSchema = z.object({
  email: z.string().email("Validation.emailInvalid"),
});

type NewsletterValues = z.infer<typeof newsletterSchema>;

export default function Footer() {
  const t = useTranslations("LandingPage.Footer");
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<NewsletterValues>({
    resolver: zodResolver(newsletterSchema),
  });

  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [hasScrolledPast, setHasScrolledPast] = useState(false);
  const [isScrollingToTop, setIsScrollingToTop] = useState(false);
  const [clickedFrom, setClickedFrom] = useState<"dock" | "float" | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Reset scroll to top states once we reach the top of the page
      if (scrollY < 10) {
        setIsScrollingToTop(false);
        setClickedFrom(null);
      }
      
      setHasScrolledPast(scrollY > 100);

      const dock = document.getElementById("back-to-top-dock");
      if (dock) {
        const dockRect = dock.getBoundingClientRect();
        // The floating button is fixed bottom-6 (24px) or bottom-8 (32px) on desktop.
        // It has a height of 40px. We dock exactly when the docking station in the footer
        // scrolls up and meets the floating button's vertical position in the viewport (around 76px from bottom).
        const triggerHeight = window.innerHeight - 76;
        setIsFooterVisible(dockRect.top <= triggerHeight);
      } else {
        // Fallback if dock element is not rendered or found yet
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        setIsFooterVisible(scrollY + clientHeight >= scrollHeight - 100);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    
    // Tiny timeout to ensure the DOM is fully settled
    const timer = setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      clearTimeout(timer);
    };
  }, []);

  // Suppress floating if currently animating the scroll to top from the dock (Scenario 1)
  const shouldFloat = hasScrolledPast && !isFooterVisible && !(isScrollingToTop && clickedFrom === "dock");

  const scrollToTop = (from: "dock" | "float") => {
    setClickedFrom(from);
    setIsScrollingToTop(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    notify.success(t("newsletter.success") || "Inscrição realizada!");
    reset();
  };

  return (
    <footer id="footer" className="pb-4 md:pb-0">
      <div className="relative rounded-3xl md:rounded-4xl overflow-hidden transition-all">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/textures/cubes.png')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

        <div className="px-4 lg:px-22 py-8 md:py-16 relative z-10 bg-background">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 mb-12 md:mb-16 md:px-4">
            <div className="space-y-3 text-center lg:text-left">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {t("newsletter.title") || "Pronto para fluência?"}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-md mx-auto lg:mx-0">
                {t("newsletter.description") ||
                  "Receba conteúdos exclusivos..."}
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex w-full max-w-md gap-2 flex-col sm:flex-row"
            >
              <div className="relative w-full">
                <Input
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  placeholder={t("newsletter.placeholder") || "seu@email.com"}
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-8 rounded-lg font-medium w-full sm:w-auto transition-all active:scale-95"
              >
                {t("newsletter.button") || "Assinar"}
              </Button>
            </form>
          </div>

          <hr className="border-slate-100 dark:border-slate-800 mb-8 md:mb-12" />

          <div className="grid justify-items-center lg:justify-items-center grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-x-4 gap-y-10 lg:gap-8 items-start">
            <div className="col-span-2 lg:col-span-4 space-y-4 text-center lg:text-left flex flex-col items-center lg:items-start">
              <div className="flex items-center gap-1.5 font-bold tracking-tighter text-xl text-slate-900 dark:text-white select-none">
                <Image
                  src={Logo}
                  alt="Logo"
                  width={200}
                  style={{ height: "auto", width: "200" }}
                  priority
                />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-xs mx-auto lg:mx-0">
                {t("brand.description") || "Transformando o aprendizado..."}
              </p>
            </div>

            {[
              {
                title: t("sections.student.title") || "Aluno",
                links: [
                  {
                    label: t("sections.student.links.certificate"),
                    href: "/certificate",
                  },
                  {
                    label: t("sections.student.links.rescheduling"),
                    href: "#",
                  },
                  {
                    label: t("sections.student.links.portal"),
                    href: "/signin",
                  },
                ],
              },
              {
                title: t("sections.about.title") || "Sobre",
                links: [
                  { label: t("sections.about.links.methodology"), href: "#" },
                  {
                    label: t("sections.about.links.privacy"),
                    href: "/privacy",
                  },
                  { label: t("sections.about.links.terms"), href: "/terms" },
                ],
              },
              {
                title: t("sections.support.title") || "Suporte",
                links: [
                  { label: t("sections.support.links.contact"), href: "#" },
                  { label: t("sections.support.links.faq"), href: "#" },
                ],
              },
            ].map((section, idx) => (
              <div key={idx} className="col-span-1 lg:col-span-2 space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                  {section.title}
                </h4>
                <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  {section.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link
                        href={link.href}
                        className="hover:text-primary transition-colors block py-1"
                      >
                        {link.label || "Link"}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="col-span-1 lg:col-span-2 space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                {t("sections.social.title") || "Social"}
              </h4>
              <div className="flex gap-2">
                <SocialButton
                  href="#"
                  color="bg-[#25D366]"
                  ariaLabel="Conectar via WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </SocialButton>
                <SocialButton
                  href="#"
                  color="bg-black dark:bg-white dark:text-black"
                  ariaLabel="Enviar e-mail de suporte"
                >
                  <AtSign className="w-4 h-4" />
                </SocialButton>
              </div>
            </div>
          </div>

          <div className="mt-12 md:mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse md:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium text-center md:text-left">
              {t("copyright") ||
                "© 2026 FluencyLab. Todos os direitos reservados."}
            </p>

            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <LanguageSwitcher />
              
              {/* Premium Visually Visible Docking Station Slot */}
              <div id="back-to-top-dock" className="relative -right-12 md:right-0 lg:right-0 w-[140px] h-[40px] rounded-full border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-center overflow-visible select-none">
                {/* Empty Dock Indicator: visible only when button is detached */}
                {shouldFloat && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.6, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse" />
                    DOCK
                  </motion.div>
                )}

                {!shouldFloat && (
                  <motion.button
                    layoutId="back-to-top"
                    onClick={() => scrollToTop("dock")}
                    className="absolute inset-0 w-full h-full group flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-white/40 dark:bg-slate-950/30 border border-slate-200/20 dark:border-slate-800/30 hover:border-slate-200/50 dark:hover:border-slate-800/50 shadow-none rounded-full cursor-pointer transition-colors duration-300 active:scale-95 overflow-hidden"
                    transition={{ type: "spring", stiffness: 85, damping: 16 }}
                  >
                    {t("backToTop") || "Voltar ao topo"}
                    <ArrowUp className="w-3.5 h-3.5 transition-transform duration-350 ease-in-out group-hover:-translate-y-1 opacity-70 group-hover:opacity-100" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating button when active on desktop/mobile scroll */}
      {shouldFloat && (
        <motion.button
          layoutId="back-to-top"
          onClick={() => scrollToTop("float")}
          animate={{
            y: isScrollingToTop && clickedFrom === "float" ? 120 : 0,
            opacity: isScrollingToTop && clickedFrom === "float" ? 0 : 1,
          }}
          className="fixed bottom-6 right-6 md:bottom-6 md:right-8 lg:bottom-8 lg:right-[104px] w-[140px] h-[40px] z-50 group flex items-center justify-center gap-2 text-xs font-regular text-slate-800 dark:text-slate-200 bg-white/95 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)] rounded-full hover:scale-105 active:scale-95 cursor-pointer"
          transition={{ type: "spring", stiffness: 85, damping: 16 }}
        >
          {t("backToTop") || "Voltar ao topo"}
          <ArrowUp className="w-3.5 h-3.5 transition-transform duration-350 ease-in-out group-hover:-translate-y-1" />
        </motion.button>
      )}
    </footer>
  );
}

function SocialButton({
  children,
  href,
  color,
  ariaLabel,
}: {
  children: React.ReactNode;
  href: string;
  color: string;
  ariaLabel: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:scale-110",
        color,
      )}
    >
      {children}
    </a>
  );
}
