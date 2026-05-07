"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export function TransitionAnimation() {
  const t = useTranslations("Transition");
  
  const sentences = [
    t("sentences.0"),
    t("sentences.1"),
    t("sentences.2"),
    t("sentences.3"),
    t("sentences.4"),
    t("sentences.5"),
    t("sentences.6"),
    t("sentences.7"),
  ].filter(Boolean);

  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const fadeOutTimeout = setTimeout(() => setFade(false), 2500);
    const fadeInTimeout = setTimeout(() => {
      setCurrentSentenceIndex(
        (prevIndex) => (prevIndex + 1) % sentences.length
      );
      setFade(true);
    }, 3000);

    return () => {
      clearTimeout(fadeOutTimeout);
      clearTimeout(fadeInTimeout);
    };
  }, [currentSentenceIndex, sentences.length]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-background z-100 animate-in fade-in duration-500 flex flex-col items-center justify-center">
      <video
        className="lg:w-[20%] md:w-[35%] w-[60%] max-h-[50vh] pointer-events-none"
        controls={false}
        loop
        autoPlay
        muted
        playsInline
      >
        <source
          src="https://firebasestorage.googleapis.com/v0/b/fluencylab-webapp.appspot.com/o/Animations%2FFluencyLab_Final.webm?alt=media&token=870b22b3-0a99-4301-b736-f1c6ad30bab5"
          type="video/webm"
        />
      </video>

      <div
        className={`absolute bottom-20 left-0 right-0 flex justify-center px-6 ${fade ? "fade-in" : "fade-out"}`}
      >
        <p className="text-base md:text-lg font-medium text-foreground/80 text-center max-w-sm">
          {sentences[currentSentenceIndex]}
        </p>
      </div>
    </div>
  );
}
