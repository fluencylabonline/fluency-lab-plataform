"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UnscrambleViewProps {
  words: string[];
  correctSentence: string;
  onComplete: (isCorrect: boolean) => void;
  onChange: (sentence: string) => void;
}

export function UnscrambleView({ words, correctSentence, onComplete, onChange }: UnscrambleViewProps) {
  const [availableWords, setAvailableWords] = useState<Array<{ id: string, text: string }>>(() => 
    words.map((word, idx) => ({ id: `${idx}-${word}`, text: word }))
  );
  const [selectedWords, setSelectedWords] = useState<Array<{ id: string, text: string }>>([]);

  const handlePick = (word: { id: string, text: string }) => {
    const newSelected = [...selectedWords, word];
    setSelectedWords(newSelected);

    const newAvailable = availableWords.filter(w => w.id !== word.id);
    setAvailableWords(newAvailable);

    checkCompletion(newSelected);
  };

  const handleRemove = (word: { id: string, text: string }) => {
    const newSelected = selectedWords.filter(w => w.id !== word.id);
    setSelectedWords(newSelected);
    
    // We need to re-insert the word into available, maybe sort by ID or just append
    setAvailableWords([...availableWords, word]);

    checkCompletion(newSelected);
  };

  const checkCompletion = (currentSelected: Array<{ id: string, text: string }>) => {
    const currentSentence = currentSelected.map(w => w.text).join(" ");
    onChange(currentSentence);

    // Note: This is a simple check. We could normalize punctuation/case if needed.
    // But the server expects the user to pick correctly.
    // For the UI state, we just need to know if they matched.
    if (currentSentence.toLowerCase() === correctSentence.toLowerCase()) {
      onComplete(true);
    } else {
      onComplete(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-12 py-8">
      {/* Target Area */}
      <div className="min-h-[120px] p-4 border-b-2 border-slate-200 dark:border-gray-800 flex flex-wrap gap-2 items-center justify-center">
        <AnimatePresence>
          {selectedWords.map((word) => (
            <motion.button
              key={word.id}
              layoutId={`word-${word.id}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={() => handleRemove(word)}
              className="px-4 py-2 bg-card border-2 border-b-4 border-slate-200 dark:border-gray-800 rounded-xl font-bold text-lg hover:bg-accent transition-colors"
            >
              {word.text}
            </motion.button>
          ))}
        </AnimatePresence>
        {selectedWords.length === 0 && (
          <p className="text-slate-300 dark:text-gray-600 font-medium italic">
            Clique nas palavras para formar a frase...
          </p>
        )}
      </div>

      {/* Source Area */}
      <div className="flex flex-wrap gap-2 justify-center">
        {availableWords.map((word) => (
          <motion.button
            key={word.id}
            layout
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePick(word)}
            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-b-4 border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-lg text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
          >
            {word.text}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
