"use client";

import { useDevice } from "@/hooks/ui/use-device";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Share, 
  PlusSquare, 
  MoreVertical, 
  Download, 
  Apple, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight 
} from "lucide-react";
import Link from "next/link";

interface DownloadClientProps {
  translations: {
    title: string;
    subtitle: string;
    installButton: string;
    iosTitle: string;
    iosStep1: string;
    iosStep2: string;
    iosStep3: string;
    androidTitle: string;
    androidStep1: string;
    androidStep2: string;
    androidStep3: string;
    alreadyInstalled: string;
    backToPlatform: string;
  };
}

export function DownloadClient({ translations: t }: DownloadClientProps) {
  const { isStandalone, isInstallable, install } = useDevice();
  const [activeTab, setActiveTab] = useState<"ios" | "android">("ios");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      // Tenta detectar o SO do usuário para pré-selecionar a aba correta
      if (typeof window !== "undefined" && window.navigator) {
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
          setActiveTab("ios");
        } else if (/android/.test(userAgent)) {
          setActiveTab("android");
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-4 py-8">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-violet-500/10 blur-[120px] dark:bg-violet-600/5" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[80vw] h-[80vw] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-600/5" />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-md w-full mx-auto relative z-10 space-y-8">
        
        {/* Logo/Icon */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-violet-600 to-blue-600 blur-md opacity-40 dark:opacity-60" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/icons/android/launchericon-transparent-512x512.png" 
              alt="FluencyLab" 
              className="relative w-28 h-28 object-contain rounded-3xl bg-slate-900 border border-slate-800 p-2"
            />
          </div>
          <div className="text-center space-y-1.5 px-4">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-blue-500 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent">
              FluencyLab
            </h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {t.subtitle}
            </p>
          </div>
        </motion.div>

        {isStandalone ? (
          /* PWA já instalado e rodando em modo standalone */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="card w-full border border-emerald-500/20 bg-emerald-500/5 p-6 rounded-2xl text-center space-y-4"
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                {t.alreadyInstalled}
              </h3>
              <p className="text-xs text-slate-500">
                Você já está utilizando o aplicativo oficial da plataforma.
              </p>
            </div>
            <Link 
              href="/hub"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-medium text-white transition-all hover:bg-emerald-500"
            >
              {t.backToPlatform}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          /* Fluxo de Instalação */
          <div className="w-full space-y-5">
            {isInstallable && (
              /* Botão de instalação nativo se compatível */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <button
                  onClick={install}
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-sm font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  {t.installButton}
                </button>
              </motion.div>
            )}

            {/* Abas e Guias de Instalação Manual */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 rounded-2xl space-y-5"
            >
              {/* Tab Selector */}
              <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-900">
                <button
                  onClick={() => setActiveTab("ios")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === "ios"
                      ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 font-bold border border-slate-200 dark:border-slate-800"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Apple className="w-4 h-4" />
                  iPhone / iPad
                </button>
                <button
                  onClick={() => setActiveTab("android")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === "android"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold border border-slate-200 dark:border-slate-800"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Android
                </button>
              </div>

              {/* Tab Content */}
              <div className="relative min-h-[220px]">
                <AnimatePresence mode="wait">
                  {activeTab === "ios" ? (
                    <motion.div
                      key="ios"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Apple className="w-4 h-4 text-slate-400" />
                        {t.iosTitle}
                      </h3>
                      
                      <div className="space-y-3.5">
                        <div className="item flex gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-900">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 font-bold text-xs">
                            1
                          </div>
                          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            {t.iosStep1}
                            <span className="inline-flex items-center align-middle mx-1 p-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <Share className="w-3.5 h-3.5" />
                            </span>
                          </p>
                        </div>

                        <div className="item flex gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-900">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 font-bold text-xs">
                            2
                          </div>
                          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            {t.iosStep2}
                            <span className="inline-flex items-center align-middle mx-1 p-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <PlusSquare className="w-3.5 h-3.5" />
                            </span>
                          </p>
                        </div>

                        <div className="item flex gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-900">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 font-bold text-xs">
                            3
                          </div>
                          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            {t.iosStep3}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="android"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-400" />
                        {t.androidTitle}
                      </h3>

                      <div className="space-y-3.5">
                        <div className="item flex gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-900">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 font-bold text-xs">
                            1
                          </div>
                          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            {t.androidStep1}
                            <span className="inline-flex items-center align-middle mx-1 p-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </span>
                          </p>
                        </div>

                        <div className="item flex gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-900">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 font-bold text-xs">
                            2
                          </div>
                          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            {t.androidStep2}
                            <span className="inline-flex items-center align-middle mx-1 p-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <Download className="w-3.5 h-3.5" />
                            </span>
                          </p>
                        </div>

                        <div className="item flex gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-900">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 font-bold text-xs">
                            3
                          </div>
                          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            {t.androidStep3}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Back Button */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <Link 
                href="/hub" 
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                {t.backToPlatform}
                <ChevronRight className="w-3 h-3" />
              </Link>
            </motion.div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4">
        <p className="text-[10px] text-slate-400 dark:text-slate-600">
          © {new Date().getFullYear()} FluencyLab. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
