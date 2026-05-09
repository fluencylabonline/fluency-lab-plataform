import { Header } from "@/components/layout/header";
import Image from "next/image";
import Link from "next/link";
import { 
  Headphones, 
  BookOpen
} from "lucide-react";
import { ActivityCarousel } from "./_components/ActivityCarousel";
import { getTranslations } from "next-intl/server";

export default async function ImmersionPage() {
  const t = await getTranslations("StudentImmersion");

  const constructionItems = [
    {
      title: t("wordleTitle"),
      icon: "wordle",
      color: "bg-green-600 dark:bg-green-800",
      href: "/hub/student/immersion/wordle",
    },
    {
      title: t("lyricsTitle"),
      icon: "music",
      color: "bg-indigo-600 dark:bg-indigo-900",
      href: "/hub/student/immersion/lyrics",
    },
    {
      title: t("wordLadderTitle"),
      icon: "layers",
      color: "bg-amber-600 dark:bg-amber-900",
      href: "/hub/student/immersion/word-ladder",
    },
  ];

  return (
    <div>
      <Header 
        title={t("title")} 
        subtitle={t("subtitle")}
        className="contents"
      />
      
      <main className="flex-1 container space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/hub/student/immersion/podcasts" className="group">
            <div className="card relative h-[200px] md:h-[350px] overflow-hidden rounded-md border-none">
              <Image
                src="/immersion/podcast.png"
                alt={t("podcastsTitle")}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent" />
              
              <div className="absolute bottom-0 left-0 p-8 text-white w-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30">
                    <Headphones className="h-6 w-6" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter">{t("podcastsTitle")}</h3>
                </div>
                <p className="text-gray-300 text-sm font-medium max-w-xs leading-relaxed">
                  {t("podcastsDescription")}
                </p>
                
                <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-md border border-white/20">
                  {t("comingSoon")}
                </div>
              </div>
            </div>
          </Link>

          <Link href="/hub/student/immersion/reading" className="group">
            <div className="card relative h-[200px] md:h-[350px] overflow-hidden rounded-md border-none">
              <Image
                src="/immersion/blog.png"
                alt={t("blogTitle")}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent" />
              
              <div className="absolute bottom-0 left-0 p-8 text-white w-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter">{t("blogTitle")}</h3>
                </div>
                <p className="text-gray-300 text-sm font-medium max-w-xs leading-relaxed">
                  {t("blogDescription")}
                </p>

                <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-md border border-white/20">
                  {t("comingSoon")}
                </div>
              </div>
            </div>
          </Link>
        </div>

        <ActivityCarousel items={constructionItems} />
      </main>
    </div>
  );
}