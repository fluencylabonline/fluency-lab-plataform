"use client";

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

const newsletterSchema = z.object({
    email: z.string().email("Validation.emailInvalid"),
});

type NewsletterValues = z.infer<typeof newsletterSchema>;

export default function Footer() {
    const t = useTranslations("LandingPage.Footer");
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<NewsletterValues>({
        resolver: zodResolver(newsletterSchema),
    });

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const onSubmit = async () => {
        // TODO: implement newsletter
        await new Promise((resolve) => setTimeout(resolve, 1000));
        notify.success(t("newsletter.success") || "Inscrição realizada!");
        reset();
    };

    return (
        <footer id="footer" className="pb-4 md:pb-0">
            <div className="relative rounded-3xl md:rounded-4xl overflow-hidden transition-all">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/textures/cubes.png')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

                <div className="mx-auto px-4 sm::px-22 py-8 md:py-16 relative z-10 bg-background">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-3 mb-12 md:mb-16 md:px-4">
                        <div className="space-y-3 text-center lg:text-left">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                                {t("newsletter.title") || "Pronto para fluência?"}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-md mx-auto lg:mx-0">
                                {t("newsletter.description") || "Receba conteúdos exclusivos..."}
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
                                    placeholder={t("newsletter.placeholder") || "seu@email.com"}
                                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-11 rounded-lg focus-visible:ring-primary/20 w-full"
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

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-x-4 gap-y-10 lg:gap-8 items-start">
                        <div className="col-span-2 lg:col-span-4 space-y-4 text-center lg:text-left flex flex-col items-center lg:items-start">
                            <div className="flex items-center gap-1.5 font-bold tracking-tighter text-xl text-slate-900 dark:text-white select-none">
                                <Image src={Logo} alt="Logo" width={200} style={{ height: "auto", width: "auto" }} priority />
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto lg:mx-0">
                                {t("brand.description") || "Transformando o aprendizado..."}
                            </p>
                        </div>

                        {[
                            {
                                title: t("sections.student.title") || "Aluno",
                                links: [
                                    { label: t("sections.student.links.certificate"), href: "/certificate" },
                                    { label: t("sections.student.links.rescheduling"), href: "#" },
                                    { label: t("sections.student.links.portal"), href: "/signin" },
                                ]
                            },
                            {
                                title: t("sections.about.title") || "Sobre",
                                links: [
                                    { label: t("sections.about.links.methodology"), href: "#" }, //TODO: Create page explaining methodology
                                    { label: t("sections.about.links.privacy"), href: "/privacy" },
                                    { label: t("sections.about.links.terms"), href: "/terms" },
                                ]
                            },
                            {
                                title: t("sections.support.title") || "Suporte",
                                links: [
                                    { label: t("sections.support.links.contact"), href: "#" }, //TODO: Create contact page
                                    { label: t("sections.support.links.faq"), href: "#" }, //TODO: Create faq page
                                ]
                            }
                        ].map((section, idx) => (
                            <div key={idx} className="col-span-1 lg:col-span-2 space-y-4">
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                                    {section.title}
                                </h4>
                                <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
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
                                <SocialButton href="#" color="bg-[#25D366]" ariaLabel="Conectar via WhatsApp">
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
                        <p className="text-slate-400 text-xs font-medium text-center md:text-left">
                            {t("copyright") || "© 2026 FluencyLab. Todos os direitos reservados."}
                        </p>

                        <button
                            onClick={scrollToTop}
                            className="transition-all duration-300 ease-in-out group flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-primary py-2 px-4 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            {t("backToTop") || "Voltar ao topo"}
                            <ArrowUp className="w-3 h-3 transition-all duration-300 ease-in-out group-hover:-translate-y-1" />
                        </button>
                    </div>
                </div>
            </div>
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