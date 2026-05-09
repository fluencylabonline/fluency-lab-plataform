"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FluencyLabLogo } from "../animated-icons/fluencylab-logo";

export function SplashScreen() {
  const [stage, setStage] = useState<'logo' | 'reveal' | 'finished'>('logo');

  useEffect(() => {
    // 1. Fase Inicial: Mostra o logo centralizado (como no manifest)
    const timer1 = setTimeout(() => {
      setStage('reveal'); // Muda para a fase de animação de revelação
    }, 1500); // Mostra o logo estático por 1.5 segundos

    // 2. Fase de Limpeza: Remove o componente após a animação de revelação terminar
    const timer2 = setTimeout(() => {
      setStage('finished');
    }, 3000); // Tempo total (1.5s logo + 1s revelação + margem)

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Se já terminou, remove da árvore do DOM
  if (stage === 'finished') return null;

  // Variantes de animação para o overlay de revelação circular
  const overlayVariants = {
    initial: {
      // Começa como uma sobreposição preta sólida
      opacity: 1,
      // Máscara CSS circular no centro, com tamanho 0%
      clipPath: "circle(0% at 50% 50%)",
    },
    animate: {
      opacity: 1,
      // Expande o círculo até cobrir toda a tela (usando 150% para garantir os cantos)
      clipPath: "circle(150% at 50% 50%)",
      transition: {
        duration: 1, // Duração da animação de expansão
        ease: "easeInOut" as const, // Tipo de transição suave
      },
    },
    exit: {
      // Fase final opcional de fade out para suavizar a entrada da tela real
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  // Variantes para o esmaecimento do logo
  const logoVariants = {
    logoActive: { opacity: 1 },
    revealActive: { 
      opacity: 0,
      scale: 1.1, // Pequeno aumento de escala opcional para dinamismo
      transition: { duration: 0.5, ease: "easeInOut" as const }
    },
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-9999 flex items-center justify-center bg-[#212121] overflow-hidden">
        {/* Camada do Logo - Esmaece quando a revelação começa */}
        <motion.div
          className="relative"
          variants={logoVariants}
          initial="logoActive"
          animate={stage === 'logo' ? "logoActive" : "revealActive"}
        >
          <FluencyLabLogo width={192} height="auto" />
        </motion.div>

        {/* Camada da Máscara de Revelação Circular */}
        <motion.div
          className="absolute inset-0 bg-content-color" // Camada preta idêntica ao fundo
          variants={overlayVariants}
          initial="initial"
          // Só começa a animação quando entra no estágio 'reveal'
          animate={stage === 'reveal' ? "animate" : "initial"}
          exit="exit"
        />
      </div>
    </AnimatePresence>
  );
}