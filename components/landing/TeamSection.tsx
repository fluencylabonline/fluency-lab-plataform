"use client";

import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useTranslations } from "next-intl";
import { containerVariants, itemVariants } from "@/lib/animations";

type TeamMember = {
  name: string;
  role: string;
  image: string;
  bio: string;
  lang: string;
};

const TutorCard = ({ member }: { member: TeamMember }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="group flex flex-col items-center text-center p-4 rounded-2xl transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-900/50"
  >
    <div className="relative mb-4">
      <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white dark:border-slate-950 group-hover:border-primary/20 transition-colors duration-300">
        <AvatarImage src={member.image} alt={member.name} />
        <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-400">
          {member.name?.[0] || "?"}
        </AvatarFallback>
      </Avatar>

      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-950 px-2 py-0.5 rounded-full text-xs border border-slate-100 dark:border-slate-800">
        {member.lang}
      </span>
    </div>

    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 group-hover:text-primary transition-colors duration-300">
      {member.name}
    </h3>
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
      {member.role}
    </p>
    <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px] leading-relaxed">
      {member.bio}
    </p>

    <div className="mt-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
      <Globe className="w-4 h-4 text-slate-400 hover:text-primary cursor-pointer transition-colors" />
    </div>
  </motion.div>
);

export default function TeamSection() {
  const t = useTranslations("LandingPage.Team");

  const team: TeamMember[] = [
    {
      name: t("members.ana.name") || "Ana Silva",
      role: t("members.ana.role") || "Head de Metodologia",
      image: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
      bio: t("members.ana.bio") || "",
      lang: "🇧🇷 🇺🇸",
    },
    {
      name: t("members.mark.name") || "Mark Miller",
      role: t("members.mark.role") || "English Lead",
      image: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
      bio: t("members.mark.bio") || "",
      lang: "🇬🇧",
    },
    {
      name: t("members.sofia.name") || "Sofia Martinez",
      role: t("members.sofia.role") || "Tutora de Espanhol",
      image: "https://i.pravatar.cc/150?u=a042581f4e29026704e",
      bio: t("members.sofia.bio") || "",
      lang: "🇦🇷",
    },
    {
      name: t("members.lucas.name") || "Lucas Oliveira",
      role: t("members.lucas.role") || "Coordenador de Alunos",
      image: "https://i.pravatar.cc/150?u=a042581f4e29026704f",
      bio: t("members.lucas.bio") || "",
      lang: "🇧🇷",
    },
  ];

  return (
    <section className="py-6 overflow-hidden">
      <div className="px-4 mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row items-start gap-16 lg:gap-24">
          <div className="w-full lg:w-1/2 order-2 lg:order-1">
            <div className="block lg:hidden">
              <Carousel
                opts={{ align: "start", loop: true }}
                className="w-full max-w-sm mx-auto"
              >
                <CarouselContent>
                  {team.map((member, index) => (
                    <CarouselItem
                      key={index}
                      className="basis-1/2 sm:basis-1/2"
                    >
                      <TutorCard member={member} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-center mt-4 gap-2">
                  <span className="text-xs text-slate-300">
                    {t("mobileSwipe") || "Deslize para ver →"}
                  </span>
                </div>
              </Carousel>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="hidden lg:grid grid-cols-2 gap-x-4 gap-y-8"
            >
              {team.map((member, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <TutorCard member={member} />
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="w-full lg:w-1/2 order-1 lg:order-2 text-center lg:text-left space-y-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col space-y-4"
            >
              <motion.div variants={itemVariants} className="flex justify-center lg:justify-start">
                <Badge
                  variant="outline"
                  className="px-4 py-1 border-primary/20 text-primary bg-primary/5"
                >
                  {t("badge") || "Nossos Experts"}
                </Badge>
              </motion.div>
              <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {t.rich("title", {
                  primary: (chunks) => <span className="text-primary">{chunks}</span>
                }) || "Conheça nosso time"}
              </motion.h2>
              <motion.p variants={itemVariants} className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t("description") || "Tutores dedicados..."}
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="rounded-full px-8 text-base font-semibold transition-all hover:scale-105"
                >
                  {t("cta") || "Quero marcar uma aula teste"}
                </Button>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center lg:justify-start gap-8">
                <div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                    {t("stats.tutors") || "+150"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t("stats.tutorsLabel") || "Tutores Nativos"}
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                    {t("stats.rating") || "4.9/5"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t("stats.ratingLabel") || "Avaliação Média"}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}