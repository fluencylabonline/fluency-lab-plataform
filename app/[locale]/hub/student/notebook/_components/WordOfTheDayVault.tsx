"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultFooter,
  VaultPrimaryButton,
  VaultInput,
} from "@/components/ui/vault";
import {
  Sparkles,
  Volume2,
  Eye,
  Play,
  BookOpen,
  Quote,
  CheckCircle2,
  Check,
  RotateCcw,
  Shuffle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { LearningItem, VocabMetadata, StructureMetadata } from "@/modules/curriculum/curriculum.types";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { notify } from "@/components/ui/toaster";
import Image from "next/image";
import { claimWordOfTheDayXPAction } from "@/modules/user/user.actions";

interface WordOfTheDayVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: (LearningItem & { languageCode?: string }) | null;
  xpAlreadyClaimed?: boolean;
  onXPClaimed?: () => void;
}

type Step = "idle" | "practicing" | "revealed" | "finished";

interface ScrambleWord {
  id: number;
  word: string;
}

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Split sentence preserving punctuation attached to words
function tokenize(sentence: string): string[] {
  return sentence.trim().split(/\s+/).filter(Boolean);
}

export function WordOfTheDayVault({ open, onOpenChange, item, xpAlreadyClaimed = false, onXPClaimed }: WordOfTheDayVaultProps) {
  const t = useTranslations("WordOfTheDay");
  const [step, setStep] = useState<Step>("idle");
  const [inputValue, setInputValue] = useState("");

  // 0: Audio (Dictation), 1: Word Scramble — derived from the day, no state needed
  const mode = new Date().getDate() % 2;

  // --- SCRAMBLE STATE ---
  const [scramblePool, setScramblePool] = useState<ScrambleWord[]>([]);
  const [scrambleAnswer, setScrambleAnswer] = useState<ScrambleWord[]>([]);

  useEffect(() => {
    if (!open) {
      // Use setTimeout to avoid synchronous setState inside an effect body
      setTimeout(() => {
        setStep("idle");
        setInputValue("");
        setScramblePool([]);
        setScrambleAnswer([]);
      }, 0);
    }
  }, [open]);

  // --- SPEECH HELPERS (must be before early return to satisfy Rules of Hooks) ---
  const speak = useCallback(
    (text: string) => {
      if (!item) return;
      if (!window.speechSynthesis) {
        notify.error("Speech synthesis not supported in this browser");
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = item.languageCode || item.id.split("_")[0].toLowerCase();
      const targetLang =
        langCode === "en" ? "en-US" : langCode === "pt" ? "pt-BR" : langCode;
      const voices = window.speechSynthesis.getVoices();
      const voice =
        voices.find((v) => v.lang.startsWith(targetLang)) ||
        voices.find((v) => v.lang.startsWith(langCode));
      if (voice) utterance.voice = voice;
      utterance.lang = targetLang;
      utterance.rate = 0.85;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    },
    [item]
  );

  // --- SCRAMBLE INIT (must be before early return to satisfy Rules of Hooks) ---
  const isStructure = item?.type === "STRUCTURE";
  const isVocab = !isStructure;
  const vocabMeta = !isStructure ? (item?.metadata as VocabMetadata) : null;
  const structMeta = isStructure ? (item?.metadata as StructureMetadata) : null;

  const practiceExampleForCallback = isStructure 
    ? (structMeta?.examples?.[1] ?? structMeta?.examples?.[0])
    : (vocabMeta?.examples?.[1] ?? vocabMeta?.examples?.[0]);

  const initScramble = useCallback(() => {
    if (!practiceExampleForCallback?.text) return;
    const words = tokenize(practiceExampleForCallback.text);
    const pool = shuffle(words.map((word, i) => ({ id: i, word })));
    setScramblePool(pool);
    setScrambleAnswer([]);
  }, [practiceExampleForCallback]);

  if (!item) return null;

  // --- DATA EXTRACTION ---
  const phonetic = vocabMeta?.phonetic || "";
  const mainMeaning = vocabMeta?.meanings?.[0] || { definition: "", translation: "" };
  
  // Prioritize top-level translation field from metadata
  const translation = (isStructure ? structMeta?.translation : vocabMeta?.translation) 
    || (isStructure ? structMeta?.examples?.[0]?.translation : mainMeaning.translation)
    || item.translation;

  const definition = isStructure ? structMeta?.explanation : mainMeaning.definition;
  const imageUrl = vocabMeta?.image_url;

  // Study uses examples[0]; practice uses examples[1] (different from study), fallback to examples[0]
  const examples = (isStructure ? structMeta?.examples : vocabMeta?.examples) || [];
  const studyExample = examples[0];
  const practiceExample = examples.length > 1 ? examples[1] : examples[0];

  // For structures, we might want to show the structure_type as the main title
  const displayLemma = isStructure ? structMeta?.structure_type : item.lemma;

  const handleSpeakWord = () => speak(item.lemma);
  const handleSpeakSentence = (text: string) => speak(text);

  // --- ACTION HANDLERS ---
  const handleStartPractice = () => {
    setStep("practicing");
    setInputValue("");
    if (mode === 1) initScramble();
  };

  const handleFinish = async () => {
    setStep("finished");
    if (!xpAlreadyClaimed) {
      const result = await claimWordOfTheDayXPAction();
      if (result?.data?.success) {
        onXPClaimed?.();
        notify.success(t("xpEarned") || "+10 XP ganhos! Continue assim!");
      }
    } else {
      notify.success(t("finishedMessage") || "Concluído!");
    }
    setTimeout(() => onOpenChange(false), 2200);
  };

  const handleCheckAnswer = (target: string) => {
    if (!inputValue.trim()) return;
    const isCorrect = inputValue.trim().toLowerCase() === target.trim().toLowerCase();
    if (isCorrect) {
      notify.success(t("correctAnswer") || "Correto! Muito bem.");
      setStep("revealed");
    } else {
      notify.error(t("incorrectAnswer") || "Ops! Tente novamente.");
    }
  };

  // --- SCRAMBLE HANDLERS ---
  const handlePickWord = (word: ScrambleWord) => {
    setScramblePool((prev) => prev.filter((w) => w.id !== word.id));
    setScrambleAnswer((prev) => [...prev, word]);
  };

  const handleRemoveWord = (word: ScrambleWord) => {
    setScrambleAnswer((prev) => prev.filter((w) => w.id !== word.id));
    setScramblePool((prev) => [...prev, word]);
  };

  const handleCheckScramble = () => {
    if (scrambleAnswer.length === 0) return;
    const original = tokenize(practiceExample?.text || "");
    const userAnswer = scrambleAnswer.map((w) => w.word);
    const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(original);
    if (isCorrect) {
      notify.success(t("correctAnswer") || "Correto! Muito bem.");
      setStep("revealed");
    } else {
      notify.error(t("incorrectAnswer") || "Ops! A ordem está errada. Tente novamente.");
    }
  };

  const handleResetScramble = () => initScramble();

  // --- VIEWS ---

  // 1. STUDY PHASE
  const renderStudyView = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col w-full gap-5 text-left"
    >
      {imageUrl && isVocab && (
        <div className="w-full h-44 overflow-hidden rounded-2xl border border-border/50 relative group">
          <Image
            src={imageUrl}
            alt={item.lemma}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
        </div>
      )}

      <div className="flex items-start justify-between px-1">
        <div className="flex flex-col">
          <h3 className="text-4xl font-black tracking-tight text-primary">{displayLemma}</h3>
          {phonetic && (
            <p className="text-muted-foreground font-serif text-lg tracking-wide opacity-80">
              {phonetic}
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleSpeakWord}
          className="rounded-full w-12 h-12 transition-all shrink-0"
        >
          <Volume2 className="w-5 h-5 text-primary" />
        </Button>
      </div>

      <div className="bg-card border p-4 rounded-2xl flex flex-col gap-1">
        <p className="text-xl font-bold text-card-foreground">{translation}</p>
        {definition && (
          <p className="text-sm text-muted-foreground leading-relaxed">{definition}</p>
        )}
      </div>

      {studyExample?.text && (
        <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl relative">
          <Quote className="absolute -top-3 -left-2 w-8 h-8 text-primary/20 rotate-180" />
          <div className="relative z-10 space-y-1">
            <p className="font-medium italic leading-relaxed text-foreground">
              &ldquo;{studyExample.text}&rdquo;
            </p>
            {studyExample.translation && (
              <p className="text-sm text-muted-foreground/80">{studyExample.translation}</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );

  // 2. PRACTICE PHASE
  const renderPracticeMode = () => {
    switch (mode) {

      // ── MODE 0: AUDIO DICTATION ──────────────────────────────────────────
      case 0: {
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center w-full gap-6"
          >
            {/* Context sentence */}
            {practiceExample?.text && (
              <div className="w-full bg-muted/40 p-5 rounded-2xl border border-border/40 relative">
                <Quote className="absolute -top-3 -left-2 w-8 h-8 text-primary/15 rotate-180" />
                <p className="text-base font-medium leading-relaxed text-center text-foreground/80 relative z-10">
                  &ldquo;{step === "revealed"
                    ? practiceExample.text
                        .split(new RegExp(`(${item.lemma})`, "gi"))
                        .map((part, i) =>
                          part.toLowerCase() === item.lemma.toLowerCase() ? (
                            <span key={i} className="text-primary font-black bg-primary/10 px-1 rounded-md">
                              {part}
                            </span>
                          ) : (
                            part
                          )
                        )
                    : isStructure 
                      ? practiceExample.text // For structures, dictation might be for the whole sentence?
                      : practiceExample.text.replace(new RegExp(item.lemma, "gi"), "____")
                  }&rdquo;
                </p>
                {practiceExample.translation && step !== "revealed" && (
                  <p className="text-xs text-muted-foreground/60 text-center mt-2 italic">
                    {isStructure 
                      ? practiceExample.translation 
                      : practiceExample.translation.replace(new RegExp(item.lemma, "gi"), "____")}
                  </p>
                )}
              </div>
            )}

            {/* Listen buttons */}
            <div className="flex flex-col items-center gap-2">
              <p className="hidden text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {t("listenFirst") || "Ouça a palavra"}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSpeakWord}
                  className="hidden w-16 h-16 bg-primary text-primary-foreground rounded-full items-center justify-center hover:scale-105 transition-transform border-b-4 border-black/20 active:border-b-0 active:translate-y-1"
                  title={t("listenWord") || "Ouvir a palavra"}
                >
                  <Play className="w-7 h-7 fill-current ml-1" />
                </button>
                {practiceExample?.text && (
                  <button
                    onClick={() => handleSpeakSentence(practiceExample.text)}
                    className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full flex items-center gap-2 text-sm font-medium hover:bg-secondary/80 transition-colors border border-border"
                    title={t("listenSentence") || "Ouvir a frase"}
                  >
                    <Volume2 className="w-4 h-4" />
                    {t("listenSentence") || "Ouvir frase"}
                  </button>
                )}
              </div>
            </div>

            {/* Input / Revealed */}
            <AnimatePresence mode="wait">
              {step === "revealed" ? (
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-2 w-full"
                >
                  <h3 className="text-4xl font-black tracking-tight text-primary">{displayLemma}</h3>
                  <div className="bg-muted px-6 py-2 rounded-md inline-block border border-border">
                    <p className="font-medium text-foreground">{translation}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full space-y-3"
                >
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">
                    {isStructure 
                      ? (t("typeFullSentence") || "Escreva a frase completa") 
                      : (t("thenType") || "Escreva a palavra que falta")}
                  </p>
                  <VaultInput
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCheckAnswer(isStructure ? practiceExample.text : item.lemma)}
                    placeholder={isStructure 
                      ? (t("typeSentence") || "Digite a frase...") 
                      : (t("typeWhatYouHear") || "Digite a palavra...")}
                    className="text-center text-lg h-14"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleCheckAnswer(isStructure ? practiceExample.text : item.lemma)}
                      className="flex-1 h-12 rounded-2xl font-bold bg-primary text-primary-foreground"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      {t("checkAnswer") || "Verificar"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setStep("revealed")}
                      className="h-12 px-4 rounded-2xl"
                      title={t("revealWord") || "Revelar"}
                    >
                      <Eye className="w-5 h-5 text-muted-foreground" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      }

      // ── MODE 1: WORD SCRAMBLE ────────────────────────────────────────────
      case 1: {
        const correctWords = tokenize(practiceExample?.text || "");

        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center w-full gap-5"
          >
            {/* Instruction */}
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Shuffle className="w-3.5 h-3.5" />
                {t("scrambleInstruction") || "Reorganize as palavras na ordem correta"}
              </p>
            </div>

            {/* Answer zone */}
            <div className="w-full min-h-[72px] bg-primary/5 border-2 border-dashed border-primary/20 rounded-2xl p-3 flex flex-wrap gap-2 items-center">
              {step === "revealed" ? (
                // Show correct sentence highlighted
                <p className="text-sm font-medium leading-relaxed text-center w-full">
                  {correctWords.map((word, i) => (
                    <span key={i} className="inline-flex items-center gap-1 mr-1.5">
                      <span className={(isStructure ? false : word.toLowerCase() === item.lemma.toLowerCase())
                        ? "text-primary font-black bg-primary/10 px-1 rounded-md"
                        : "text-foreground font-medium"
                      }>
                        {word}
                      </span>
                    </span>
                  ))}
                </p>
              ) : scrambleAnswer.length === 0 ? (
                <p className="text-sm text-muted-foreground/50 w-full text-center italic">
                  {t("clickToPlace") || "Clique nas palavras abaixo para montar a frase..."}
                </p>
              ) : (
                scrambleAnswer.map((word) => (
                  <motion.button
                    key={word.id}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => handleRemoveWord(word)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    {word.word}
                  </motion.button>
                ))
              )}
            </div>

            {/* Word pool */}
            {step !== "revealed" && (
              <div className="w-full flex flex-wrap gap-2 justify-center">
                {scramblePool.map((word) => (
                  <motion.button
                    key={word.id}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => handlePickWord(word)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-muted border border-border rounded-md text-sm font-medium hover:bg-accent hover:border-primary/30 transition-colors"
                  >
                    <span>{word.word}</span>
                  </motion.button>
                ))}
                {scramblePool.length === 0 && scrambleAnswer.length > 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    {t("allWordsPlaced") || "Todas as palavras foram usadas!"}
                  </p>
                )}
              </div>
            )}

            {/* Translation hint */}
            {practiceExample?.translation && step !== "revealed" && (
              <p className="text-xs text-muted-foreground/60 text-center italic border-t border-border/40 pt-3 w-full">
                💡 {practiceExample.translation}
              </p>
            )}

            {/* Actions */}
            {step !== "revealed" && (
              <div className="flex gap-2 w-full">
                <Button
                  onClick={handleCheckScramble}
                  disabled={scrambleAnswer.length === 0}
                  className="flex-1 h-12 rounded-2xl font-bold bg-primary text-primary-foreground disabled:opacity-40"
                >
                  <Check className="w-5 h-5 mr-2" />
                  {t("checkAnswer") || "Verificar"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResetScramble}
                  className="h-12 px-4 rounded-2xl"
                  title={t("resetScramble") || "Recomeçar"}
                >
                  <RotateCcw className="w-5 h-5 text-muted-foreground" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep("revealed")}
                  className="h-12 px-4 rounded-2xl"
                  title={t("revealWord") || "Ver resposta"}
                >
                  <Eye className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>
            )}

            {/* Revealed state: listen again */}
            {step === "revealed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => practiceExample?.text && handleSpeakSentence(practiceExample.text)}
                className="gap-2 rounded-full px-6"
              >
                <Volume2 className="w-4 h-4" />
                {t("listen") || "Ouvir a frase"}
              </Button>
            )}
          </motion.div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="sm:max-w-md">
        <VaultHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/20">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <VaultTitle className="text-center text-2xl">
            {t("title") || "Palavra do Dia"}
          </VaultTitle>
          <VaultDescription className="text-center text-base">
            {step === "finished"
              ? t("wellDone") || "Muito bem!"
              : step === "idle"
              ? t("studyPhase") || "Estude a palavra antes de praticar."
              : t("dailyChallenge") || "Hora de testar sua memória!"}
          </VaultDescription>
        </VaultHeader>

        <VaultBody className="flex flex-col items-center justify-center py-4 min-h-[350px]">
          <AnimatePresence mode="wait">
            {step === "idle" && (
              <div key="study" className="w-full">
                {renderStudyView()}
              </div>
            )}
            {(step === "practicing" || step === "revealed") && (
              <div key="practice" className="w-full">
                {renderPracticeMode()}
              </div>
            )}
            {step === "finished" && (
              <motion.div
                key="finished"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-4 py-8 text-center"
              >
                <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mb-2 border-8 border-success/5">
                  <CheckCircle2 className="w-12 h-12 text-success" />
                </div>
                <h3 className="font-bold text-2xl text-foreground">
                  {t("comeBackTomorrow") || "Volte amanhã!"}
                </h3>
                {!xpAlreadyClaimed && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-5 py-2.5 rounded-full font-black text-lg"
                  >
                    <Sparkles className="w-5 h-5" />
                    +10 XP
                  </motion.div>
                )}
                <p className="text-muted-foreground text-sm">
                  {t("masteredWord") || "Você dominou a palavra de hoje."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </VaultBody>

        <VaultFooter className="flex-col sm:flex-col gap-3 pt-4 border-t">
          {step === "idle" && (
            <VaultPrimaryButton onClick={handleStartPractice}>
              <BookOpen className="w-5 h-5 mr-2" />
              {t("practice") || "Praticar"}
            </VaultPrimaryButton>
          )}

          {step === "revealed" && (
            <VaultPrimaryButton onClick={handleFinish}>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {t("markAsLearned") || "Dominado!"}
            </VaultPrimaryButton>
          )}
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}