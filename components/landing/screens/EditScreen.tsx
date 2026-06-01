"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Bold, Italic, List, MessageSquare, ChevronLeft } from "lucide-react";

export function EditorScreen() {
  const t = useTranslations("EditScreen");
  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-950">
      {/* Header Padronizado */}
      <header className="sticky top-0 z-20 bg-gray-100 dark:bg-gray-950/95 backdrop-blur-md pt-12 pb-4 px-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button className="p-1 -ml-1 text-gray-400">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                {t("header.collabWriting") || "Collaborative Writing"}
              </p>
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                {t("header.unit") || "Unit 4"}
              </h3>
            </div>
          </div>
          <div className="flex -space-x-2">
            {[
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
              "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&h=100&q=80",
              "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&h=100&q=80"
            ].map((src, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-950 bg-gray-200 overflow-hidden"
              >
                <Image
                  src={src}
                  alt="Collaborator"
                  width={28}
                  height={28}
                />
              </div>
            ))}
            <div className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-950 bg-indigo-500 flex items-center justify-center text-[8px] text-white font-bold">
              +2
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar de Formatação */}
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-md border border-gray-100 dark:border-gray-800 overflow-x-auto scrollbar-hide">
        <button className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <Bold className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-500">
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1" />
        <button className="p-2 text-gray-500">
          <List className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-500">
          <MessageSquare className="w-4 h-4" />
        </button>
        <button className="ml-auto px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg">
          {t("header.share") || "Share"}
        </button>
      </div>

      {/* Área do Documento */}
      <main className="flex-1 overflow-y-auto p-6 font-serif">
        <div className="max-w-prose mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t("document.title") || "Title"}
          </h1>

          <div className="relative text-gray-800 dark:text-gray-300 leading-relaxed text-sm space-y-4">
            <p>
              {t("document.p1Part1") || ""}
              <span className="relative bg-yellow-200 dark:bg-yellow-900/50 px-0.5 rounded-sm">
                {t("document.p1Highlight") || ""}
                {/* Cursor do Professor */}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -top-5 left-0 bg-blue-500 text-[8px] text-white px-1 rounded flex items-center gap-1"
                >
                  <span className="font-bold">{t("document.teacherName") || "Teacher"}</span>
                  <span className="absolute top-full left-1 w-0.5 h-4 bg-blue-500" />
                </motion.span>
              </span>
              {" "}
              {t("document.p1Part2") || ""}
            </p>

            <p className="relative">
              {t("document.p2Text") || ""}
              <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse translate-y-1" />
              <span className="text-gray-400">
                {t("document.p2Placeholder") || ""}
              </span>
            </p>

            {/* Balão de Comentário Lateral */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="mt-8 p-3 bg-indigo-50 dark:bg-indigo-950/40 border-l-4 border-indigo-500 rounded-r-xl"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase">
                  {t("suggestion.title") || "Suggestion"}
                </span>
              </div>
              <p className="text-xs italic text-gray-600 dark:text-gray-400">
                {t("suggestion.text") || ""}
              </p>
            </motion.div>
            <p>{t("document.p3") || ""}</p>
            <p className="pb-32">{t("document.p4") || ""}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
