"use client";

import { LessonWithDetails } from "@/modules/curriculum/curriculum.types";
import { Badge } from "@/components/ui/badge";
import { AudioLines, MessageSquare, ListChecks } from "lucide-react";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Header } from "@/components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "next/navigation";

interface LessonDetailViewProps {
  lesson: LessonWithDetails;
}

export function LessonDetailView({ lesson }: LessonDetailViewProps) {
  const params = useParams();
  const locale = params.locale as string;

  const vocabulary = lesson.items?.filter(i => i.item.type === "VOCABULARY") || [];
  const structures = lesson.items?.filter(i => i.item.type === "STRUCTURE") || [];

  const ContentSection = (
    <div className="space-y-6">
      {/* Audio Player Section */}
      {lesson.media?.url && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <AudioLines className="w-3.5 h-3.5" />
            Áudio da Aula
          </div>
          <AudioPlayer
            url={lesson.media.url}
            title="Áudio Original"
            className="card"
          />
        </div>
      )}

      {/* Content Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <MessageSquare className="w-3.5 h-3.5" />
          Conteúdo da Lição
        </div>
        <div className="card overflow-hidden">
          <div className="p-6 md:p-8 h-[50vh] md:h-[calc(100vh-325px)] overflow-y-auto custom-scrollbar">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {lesson.contentText ? (
                <p className="whitespace-pre-wrap leading-relaxed text-text/90">{lesson.contentText}</p>
              ) : (
                <p className="italic text-muted-foreground">Nenhum conteúdo de texto disponível.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const LearningItemsSection = (
    <div className="space-y-6 md:h-[calc(100vh-160px)] md:overflow-y-auto md:pr-2 p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <ListChecks className="w-3.5 h-3.5" />
        Itens de Aprendizado
      </div>

      {/* Vocabulary */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold uppercase text-primary/70 px-1 tracking-widest">Vocabulário</h4>
        <div className="grid gap-2">
          {vocabulary.map((li, idx) => (
            <div key={idx} className="card flex items-center justify-between p-3">
              <span className="font-bold text-sm group-hover:text-primary transition-colors">{li.item.lemma}</span>
              <span className="text-xs text-muted-foreground">{(li.item.metadata as { translation?: string }).translation}</span>
            </div>
          ))}
          {vocabulary.length === 0 && (
            <p className="text-xs text-muted-foreground italic px-1">Nenhum vocabulário listado.</p>
          )}
        </div>
      </div>

      {/* Structures */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold uppercase text-primary/70 px-1 tracking-widest">Estruturas</h4>
        <div className="grid gap-2">
          {structures.map((li, idx) => (
            <div key={idx} className="card flex flex-col gap-1 p-3">
              <span className="font-bold text-sm group-hover:text-primary transition-colors">{li.item.lemma}</span>
              <span className="text-xs text-muted-foreground">{(li.item.metadata as { translation?: string }).translation}</span>
            </div>
          ))}
          {structures.length === 0 && (
            <p className="text-xs text-muted-foreground italic px-1">Nenhuma estrutura listada.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div >
      <Header
        title={lesson.title}
        showSubHeader={false}
        className="contents"
        backHref={`/${locale}/hub/teacher/lessons`}
      />

      <div className="container">
        <div className="flex items-center gap-3 mb-6">
          <Badge variant="outline" className="font-bold border-primary/20 text-primary">{lesson.difficulty}</Badge>
          <Badge variant="secondary" className="font-medium">{lesson.language?.name}</Badge>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid grid-cols-3 gap-8">
          <div className="col-span-2">
            {ContentSection}
          </div>
          <aside className="sticky top-6">
            {LearningItemsSection}
          </aside>
        </div>

        {/* Mobile/Tablet Layout (Tabs) */}
        <div className="lg:hidden">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-muted/50 rounded-2xl">
              <TabsTrigger value="content" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Conteúdo
              </TabsTrigger>
              <TabsTrigger value="items" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Vocabulário
              </TabsTrigger>
            </TabsList>
            <TabsContent value="content" className="mt-0 focus-visible:outline-none">
              {ContentSection}
            </TabsContent>
            <TabsContent value="items" className="mt-0 focus-visible:outline-none">
              {LearningItemsSection}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
