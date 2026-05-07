import { Header } from "@/components/layout/header";
import { ActivityCard } from "./_components/ActivityCard";
import { 
  Gamepad2, 
  Music2, 
  Podcast, 
  BookOpen, 
  Layers 
} from "lucide-react";

export default async function ImmersionPage() {

  const activities = [
    {
      title: "Wordle",
      description: "Adivinhe a palavra secreta em 6 tentativas usando seu vocabulário.",
      icon: <Gamepad2 className="w-6 h-6" />,
      href: "/hub/student/immersion/wordle",
      color: "emerald" as const,
    },
    {
      title: "Word Ladder",
      description: "Transforme uma palavra em outra mudando apenas uma letra por vez.",
      icon: <Layers className="w-6 h-6" />,
      href: "/hub/student/immersion/word-ladder",
      color: "blue" as const,
    },
    {
      title: "Lyrics Training",
      description: "Aprenda idiomas completando as letras das suas músicas favoritas.",
      icon: <Music2 className="w-6 h-6" />,
      href: "/hub/student/immersion/lyrics",
      color: "purple" as const,
    },
    {
      title: "Podcasts",
      description: "Pratique sua escuta com podcasts selecionados para seu nível.",
      icon: <Podcast className="w-6 h-6" />,
      href: "/hub/student/immersion/podcasts",
      color: "orange" as const,
      comingSoon: true,
    },
    {
      title: "Reading",
      description: "Artigos e histórias curtas para expandir seu vocabulário e compreensão.",
      icon: <BookOpen className="w-6 h-6" />,
      href: "/hub/student/immersion/reading",
      color: "pink" as const,
      comingSoon: true,
    },
  ];

  return (
    <div className="flex flex-col min-h-dvh">
      <Header 
        title="Imersão" 
        backHref="/hub/student"
      />
      
      <main className="flex-1 container py-8 pb-20">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Seu laboratório de imersão</h1>
          <p className="text-muted-foreground">
            Escolha uma atividade para praticar de forma divertida e natural.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.title}
              {...activity}
            />
          ))}
        </div>
      </main>
    </div>
  );
}