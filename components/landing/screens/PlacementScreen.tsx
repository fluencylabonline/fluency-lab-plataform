"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, CheckCircle2, XCircle, Play, Pause } from "lucide-react";

export function PlacementScreen() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEstimate, setCurrentEstimate] = useState<string>("B1");
  const [statusText, setStatusText] = useState<string>(
    "Initial calibration: testing intermediate vocabulary (B1)."
  );
  const [progress, setProgress] = useState(30);

  const options = [
    { id: 0, text: "made", label: "fez (criou/construiu)" },
    { id: 1, text: "did", label: "fez (executou/realizou)" },
    { id: 2, text: "has did", label: "tem feito (incorreto)" },
  ];

  // Audio Playback Auto-stop Simulator
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying) {
      timeout = setTimeout(() => {
        setIsPlaying(false);
      }, 2500); // Stop playing after 2.5 seconds
    }
    return () => clearTimeout(timeout);
  }, [isPlaying]);

  const handleCheck = () => {
    if (selectedOption === null) return;
    
    const correct = selectedOption === 0;
    setIsCorrect(correct);
    setIsChecked(true);
    setProgress(70);

    if (correct) {
      setCurrentEstimate("C1");
      setStatusText(
        "Correct! Leveling up: next question will test advanced syntax (C1)."
      );
    } else {
      setCurrentEstimate("A2");
      setStatusText(
        "Incorrect. Recalibrating: next question will test basic grammar (A2)."
      );
    }
  };

  const handleContinue = () => {
    setSelectedOption(null);
    setIsChecked(false);
    setIsCorrect(false);
    setCurrentEstimate("B1");
    setStatusText("Initial calibration: testing intermediate vocabulary (B1).");
    setProgress(30);
  };

  const getGaugePosition = (level: string) => {
    switch (level) {
      case "A1": return 5;
      case "A2": return 23;
      case "B1": return 41;
      case "B2": return 59;
      case "C1": return 77;
      case "C2": return 95;
      default: return 41;
    }
  };

  return (
    <div className="flex flex-col h-full relative bg-gray-100 dark:bg-gray-950 overflow-hidden select-none">
      {/* Header Estilo Duolingo Test */}
      <header className="sticky top-0 z-20 bg-gray-100 dark:bg-gray-950/95 backdrop-blur-md pt-12 pb-4 px-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1">
          <X className="w-5 h-5" />
        </button>
        
        {/* Barra de Progresso */}
        <div className="flex-1 mx-4 bg-gray-200 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
          <motion.div
            className="bg-[#58cc02] h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
          />
        </div>

        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-[10px] font-black tracking-wider uppercase">Adaptive</span>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {/* Badge da Questão */}
        <div>
          <span className="inline-block px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[9px] font-black rounded-lg uppercase tracking-wider">
            Listening challenge
          </span>
        </div>

        {/* Instrução */}
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-snug">
          Listen to the snippet and choose the word that correctly fills the gap:
        </h2>

        {/* Card de Áudio */}
        <div className="card p-3 flex items-center gap-3 border border-slate-200/40 dark:border-slate-800/40 bg-white/50 dark:bg-slate-900/30 rounded-2xl">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-transform active:scale-95 border-b-[4px] border-indigo-800 active:border-b-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
          
          <div className="flex-1">
            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Audio Statement (2.5s)
            </div>
            
            {/* Visualizador de Onda Sonora */}
            <div className="flex items-center gap-0.5 h-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => (
                <motion.div
                  key={bar}
                  className="w-0.5 bg-indigo-500 rounded-full"
                  animate={
                    isPlaying
                      ? { height: [4, 18, 4] }
                      : { height: 4 }
                  }
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: bar * 0.05,
                  }}
                  style={{ height: 4 }}
                />
              ))}
              {isPlaying && (
                <span className="text-[9px] text-indigo-500 font-bold ml-2 animate-pulse">
                  Playing...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Questão Textual */}
        <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-150 dark:border-gray-800/60 p-4 rounded-2xl flex items-center justify-center text-center font-serif text-sm text-gray-800 dark:text-gray-200 italic">
          &ldquo;She <span className="underline decoration-indigo-500 decoration-2 font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 rounded">___</span> a lot of progress in her studies since she joined the academy.&rdquo;
        </div>

        {/* Lista de Opções */}
        <div className="flex flex-col gap-2">
          {options.map((option, idx) => {
            const isSelected = selectedOption === option.id;
            
            let borderStyle = "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900";
            if (isSelected) {
              borderStyle = "border-[#1899f8] bg-[#e1f5fe]/40 dark:bg-[#1899f8]/10 text-[#1899f8]";
            }
            
            return (
              <button
                key={option.id}
                disabled={isChecked}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full border-2 rounded-2xl p-3 flex items-center gap-3 text-left transition-all ${borderStyle} ${
                  isChecked ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"
                }`}
              >
                {/* Indicador de Número */}
                <div
                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center text-[10px] font-black ${
                    isSelected
                      ? "border-[#1899f8] bg-[#1899f8] text-white"
                      : "border-gray-300 dark:border-gray-700 text-gray-400"
                  }`}
                >
                  {idx + 1}
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                    {option.text}
                  </span>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500">
                    {option.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Painel de Calibração IA */}
        <div className="card p-3 flex flex-col gap-2 mt-auto border border-indigo-100 dark:border-indigo-950/30 bg-indigo-50/10 dark:bg-indigo-950/5 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-wider">
                AI Diagnostic Engine
              </span>
            </div>
            <span className="text-[8px] font-black text-gray-400 bg-gray-200/50 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              REAL-TIME ESTIMATION
            </span>
          </div>
          
          {/* Gráfico do Nível */}
          <div className="relative mt-2 pt-4 pb-2">
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full" />
            
            <div className="flex justify-between text-[9px] font-bold text-gray-400 dark:text-gray-500 mt-2 px-1">
              {["A1", "A2", "B1", "B2", "C1", "C2"].map((lvl) => (
                <span 
                  key={lvl} 
                  className={
                    currentEstimate === lvl 
                      ? "text-indigo-600 dark:text-indigo-400 font-black scale-110 transition-all duration-300" 
                      : "transition-all duration-300"
                  }
                >
                  {lvl}
                </span>
              ))}
            </div>
            
            {/* Indicador Deslizante */}
            <motion.div
              className="absolute top-0.5 -translate-x-1/2 flex flex-col items-center"
              animate={{ left: `${getGaugePosition(currentEstimate)}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
            >
              <div className="w-3.5 h-3.5 bg-indigo-600 dark:bg-indigo-500 rounded-full ring-4 ring-indigo-500/25 border-2 border-white dark:border-gray-950" />
              <div className="w-0.5 h-2 bg-indigo-600 dark:bg-indigo-500" />
            </motion.div>
          </div>
          
          <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">
            {statusText}
          </p>
        </div>
      </main>

      {/* Rodapé Dinâmico */}
      {!isChecked ? (
        <div className="p-4 border-t border-gray-150 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-900/50 z-20">
          <button
            onClick={handleCheck}
            disabled={selectedOption === null}
            className={`w-full py-3 rounded-2xl font-black text-xs uppercase transition-all border-x-2 border-t-2 border-b-[6px] ${
              selectedOption !== null
                ? "bg-[#58cc02] border-[#58cc02] border-b-[#46a302] text-white hover:bg-[#61e002] active:translate-y-1 active:border-b-0"
                : "bg-gray-200 dark:bg-gray-800 border-gray-200 dark:border-gray-800 border-b-gray-300 dark:border-b-gray-900 text-gray-400 cursor-not-allowed pointer-events-none"
            }`}
          >
            Check
          </button>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className={`p-4 border-t flex flex-col gap-3 rounded-t-2xl z-30 absolute bottom-0 left-0 right-0 ${
              isCorrect 
                ? "bg-[#d7f5c5] dark:bg-[#1b3d16] border-[#b8eb97] dark:border-[#2b5922]" 
                : "bg-[#ffdfe0] dark:bg-[#3d1617] border-[#ffa8ab] dark:border-[#592224]"
            }`}
          >
            <div className="flex items-center gap-3">
              {isCorrect ? (
                <CheckCircle2 className="w-7 h-7 text-[#58cc02]" />
              ) : (
                <XCircle className="w-7 h-7 text-[#ea2b2b]" />
              )}
              <div>
                <h4 className={`text-xs font-black uppercase ${isCorrect ? "text-[#3f9e02] dark:text-[#a0e883]" : "text-[#ea2b2b] dark:text-[#f27474]"}`}>
                  {isCorrect ? "EXCELLENT!" : "INCORRECT"}
                </h4>
                {!isCorrect && (
                  <p className="text-[10px] text-red-700 dark:text-red-300">
                    Correct solution: <span className="font-bold">made</span>
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={handleContinue}
              className={`w-full py-3 rounded-2xl font-black text-xs uppercase transition-all active:translate-y-1 border-x-2 border-t-2 border-b-[6px] ${
                isCorrect
                  ? "bg-[#58cc02] border-[#58cc02] border-b-[#46a302] text-white hover:bg-[#61e002] active:border-b-0"
                  : "bg-[#ea2b2b] border-[#ea2b2b] border-b-[#c41c1c] text-white hover:bg-[#ff3b3b] active:border-b-0"
              }`}
            >
              Continue
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
