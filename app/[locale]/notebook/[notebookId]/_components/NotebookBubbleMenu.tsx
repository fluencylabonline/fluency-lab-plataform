"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { BookOpen, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { NotebookWordVault } from "./NotebookWordVault";

interface NotebookBubbleMenuProps {
  editor: Editor | null;
}

export function NotebookBubbleMenu({ editor }: NotebookBubbleMenuProps) {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isWordLoading, setIsWordLoading] = useState<boolean>(false);
  const [wordInfo, setWordInfo] = useState<{
    word: string;
    definition: string;
    synonyms: string[];
    examples: string[];
    language: string;
  } | null>(null);

  const [showBubble, setShowBubble] = useState<boolean>(false);
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startBubbleTimer = useCallback(() => {
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    bubbleTimeoutRef.current = setTimeout(() => {
      setShowBubble(false);
    }, 2000);
  }, []);

  const handleMouseEnterBubble = () => {
    if (bubbleTimeoutRef.current) {
      clearTimeout(bubbleTimeoutRef.current);
      bubbleTimeoutRef.current = null;
    }
  };

  const handleMouseLeaveBubble = () => {
    startBubbleTimer();
  };

  useEffect(() => {
    return () => {
      if (bubbleTimeoutRef.current) {
        clearTimeout(bubbleTimeoutRef.current);
      }
    };
  }, []);

  // Monitora a seleção no editor para controlar o aparecimento e inatividade da Bubble
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { empty } = editor.state.selection;
      if (!empty) {
        setShowBubble(true);
        startBubbleTimer();
      } else {
        setShowBubble(false);
        if (bubbleTimeoutRef.current) {
          clearTimeout(bubbleTimeoutRef.current);
          bubbleTimeoutRef.current = null;
        }
      }
    };

    editor.on("selectionUpdate", handleSelectionUpdate);

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor, startBubbleTimer]);

  const readAloud = () => {
    if (!editor) return;

    const { from, to, empty } = editor.state.selection;
    const selectedText = empty
      ? ""
      : editor.state.doc.textBetween(from, to, " ");

    if (selectedText) {
      // 1. Tenta buscar idioma personalizado salvo no localStorage
      let langCode = "";
      if (typeof window !== "undefined") {
        const savedLang = localStorage.getItem("reader_language");
        if (savedLang) {
          const localeMap: Record<string, string> = {
            en: "en-US",
            pt: "pt-BR",
            es: "es-ES",
            fr: "fr-FR",
            de: "de-DE",
            it: "it-IT",
          };
          langCode = localeMap[savedLang.toLowerCase()] || savedLang;
        }
      }

      // 2. Fallback heurístico caso não haja idioma selecionado nas configurações
      if (!langCode) {
        const hasPortugueseAccent = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(selectedText);
        langCode = hasPortugueseAccent ? "pt-BR" : "en-US";
      }

      // 3. Tenta buscar a velocidade configurada no localStorage
      let rate = 1;
      if (typeof window !== "undefined") {
        const savedSpeed = localStorage.getItem("reader_speed");
        if (savedSpeed) {
          rate = parseFloat(savedSpeed) || 1;
        }
      }

      const speech = new SpeechSynthesisUtterance(selectedText);
      speech.lang = langCode;
      speech.rate = rate;

      speech.onstart = () => {
        setIsSpeaking(true);
      };
      speech.onend = () => {
        setIsSpeaking(false);
      };
      speech.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(speech);
    } else {
      notify.error("Selecione um texto para ler.");
    }
  };

  const handleTtsClick = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      readAloud();
    }
  };

  const fetchWordInfo = async (word: string) => {
    setIsWordLoading(true);
    try {
      // 1. Tenta buscar idioma preferido do localStorage
      let primaryLang = "";
      if (typeof window !== "undefined") {
        primaryLang = localStorage.getItem("reader_language")?.toLowerCase() || "";
      }

      // 2. Fallback heurístico caso não haja idioma configurado
      if (!primaryLang) {
        const hasPortugueseAccent = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(word);
        primaryLang = hasPortugueseAccent ? "pt" : "en";
      }

      let response = await fetch(
        `/api/words/definition?q=${encodeURIComponent(word)}&lang=${primaryLang}`
      );
      
      let data = await response.json();
      
      if ((!data.definitions || data.definitions.length === 0) && primaryLang === "en") {
        response = await fetch(
          `/api/words/definition?q=${encodeURIComponent(word)}&lang=pt`
        );
        data = await response.json();
      }

      if (!data.definitions || data.definitions.length === 0) {
        throw new Error("Word not found");
      }

      const definitions = data.definitions || [];
      const synonyms = data.synonyms?.slice(0, 5) || [];
      const examples = data.examples?.slice(0, 3) || [];
      
      const langNames: Record<string, string> = {
        en: "Inglês",
        pt: "Português",
        es: "Espanhol",
        fr: "Francês",
        de: "Alemão",
        it: "Italiano",
      };
      const langText = langNames[primaryLang] || (primaryLang ? primaryLang.toUpperCase() : "Inglês");

      setWordInfo({
        word,
        definition: definitions[0] || "Sem definição disponível.",
        synonyms,
        examples,
        language: langText
      });
    } catch {
      notify.error("Significado não encontrado.");
      setWordInfo(null);
    } finally {
      setIsWordLoading(false);
    }
  };

  const showWordDefinition = () => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    const selectedText = empty
      ? ""
      : editor.state.doc.textBetween(from, to, " ").trim();

    if (!selectedText) {
      notify.error("Selecione uma palavra.");
      return;
    }

    const wordClean = selectedText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    if (wordClean.split(/\s+/).length === 1) {
      fetchWordInfo(wordClean.toLowerCase());
    } else {
      notify.error("Por favor, selecione apenas uma única palavra.");
    }
  };

  if (!editor) return null;

  return (
    <>
      <BubbleMenu
        editor={editor}
        shouldShow={({ editor }) => showBubble && !editor.state.selection.empty}
        className="flex items-center rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-none z-40"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          className="flex items-center gap-1"
          onMouseEnter={handleMouseEnterBubble}
          onMouseLeave={handleMouseLeaveBubble}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTtsClick}
            className={cn(
              "h-8 w-8 p-0",
              isSpeaking && "text-red-500 animate-pulse bg-red-500/10 hover:bg-red-500/20"
            )}
            title={isSpeaking ? "Parar leitura" : "Ler em voz alta"}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <div className="h-4 w-px bg-border mx-0.5" />

          <Button
            variant="ghost"
            size="sm"
            onClick={showWordDefinition}
            isLoading={isWordLoading}
            className="h-8 w-8 p-0"
            title="Dicionário / Significado"
          >
            <BookOpen className="w-4 h-4" />
          </Button>
        </motion.div>
      </BubbleMenu>

      <NotebookWordVault wordInfo={wordInfo} onClose={() => setWordInfo(null)} />
    </>
  );
}
