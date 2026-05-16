"use client";

import { useEffect, useState } from "react";
import { 
  Vault, VaultContent, VaultHeader, VaultTitle, 
  VaultBody 
} from "@/components/ui/vault";
import { getLessonByIdAction } from "@/modules/curriculum/curriculum.actions";
import { LessonWithDetails } from "@/modules/curriculum/curriculum.types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { AudioLines, MessageSquare, ListChecks } from "lucide-react";
import { VideoPlayer } from "@/components/ui/video-player";

interface LessonVaultProps {
  lessonId: string | null;
  onClose: () => void;
}

export function LessonVault({ lessonId, onClose }: LessonVaultProps) {
  const [lesson, setLesson] = useState<LessonWithDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lessonId) {
      // Use a microtask to avoid sync setState in effect error
      Promise.resolve().then(() => setLoading(true));
      
      getLessonByIdAction({ id: lessonId }).then((result) => {
        if (result?.data) {
          setLesson(result.data);
        }
        setLoading(false);
      });
    } else {
      Promise.resolve().then(() => setLesson(null));
    }
  }, [lessonId]);

  return (
    <Vault open={!!lessonId} onOpenChange={(open) => !open && onClose()}>
      <VaultContent className="sm:max-w-3xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <LoadingSpinner className="w-8 h-8" />
            <p className="text-sm text-muted-foreground animate-pulse">Carregando detalhes da lição...</p>
          </div>
        ) : lesson ? (
          <>
            <VaultHeader>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="font-bold">{lesson.difficulty}</Badge>
                <Badge variant="secondary">{lesson.language?.name}</Badge>
              </div>
              <VaultTitle className="text-left text-2xl">{lesson.title}</VaultTitle>
            </VaultHeader>

            <VaultBody className="space-y-8 mt-6">
              {/* Audio Player Section */}
              {lesson.media?.url && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    <AudioLines className="w-4 h-4" />
                    Áudio da Aula
                  </div>
                  <VideoPlayer url={lesson.media.url} provider="storage" className="aspect-[16/2] bg-muted/50" />
                </div>
              )}

              {/* Content Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  Conteúdo da Lição
                </div>
                <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {lesson.contentText ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{lesson.contentText}</p>
                    ) : (
                      <p className="italic text-muted-foreground">Nenhum conteúdo de texto disponível.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Learning Items Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  <ListChecks className="w-4 h-4" />
                  Itens de Aprendizado
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vocabulary */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-primary/70 px-1">Vocabulário</h4>
                    <div className="space-y-2">
                      {lesson.items?.filter(i => i.item.type === "VOCABULARY").map((li, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-background border border-border/50 rounded-md hover:border-primary/30 transition-colors">
                          <span className="font-bold text-sm">{li.item.lemma}</span>
                          <span className="text-xs text-muted-foreground">{(li.item.metadata as { translation?: string }).translation}</span>
                        </div>
                      ))}
                      {lesson.items?.filter(i => i.item.type === "VOCABULARY").length === 0 && (
                        <p className="text-xs text-muted-foreground italic px-1">Nenhum vocabulário listado.</p>
                      )}
                    </div>
                  </div>

                  {/* Structures */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-primary/70 px-1">Estruturas</h4>
                    <div className="space-y-2">
                      {lesson.items?.filter(i => i.item.type === "STRUCTURE").map((li, idx) => (
                        <div key={idx} className="flex flex-col gap-1 p-3 bg-background border border-border/50 rounded-md hover:border-primary/30 transition-colors">
                          <span className="font-bold text-sm">{li.item.lemma}</span>
                          <span className="text-xs text-muted-foreground">{(li.item.metadata as { translation?: string }).translation}</span>
                        </div>
                      ))}
                      {lesson.items?.filter(i => i.item.type === "STRUCTURE").length === 0 && (
                        <p className="text-xs text-muted-foreground italic px-1">Nenhuma estrutura listada.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </VaultBody>
          </>
        ) : null}
      </VaultContent>
    </Vault>
  );
}
