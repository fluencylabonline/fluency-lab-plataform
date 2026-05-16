"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface PracticeErrorViewProps {
  message?: string;
}

export function PracticeErrorView({ message }: PracticeErrorViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6"
      >
        <AlertCircle className="w-10 h-10 text-destructive" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-black mb-2">Ops! Algo deu errado.</h2>
        <p className="text-muted-foreground max-w-xs mx-auto mb-8">
          {message || "Não conseguimos carregar sua sessão de prática agora. Por favor, tente novamente mais tarde."}
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col w-full gap-3"
      >
        <Button className="w-full py-6 rounded-md font-bold gap-2">
          <Link href="/hub/student/practice">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
        </Button>

        <Button variant="ghost" className="w-full py-6 rounded-md font-bold gap-2 text-muted-foreground">
          <MessageCircle className="w-4 h-4" />
          Falar com Suporte
        </Button>
      </motion.div>
    </div>
  );
}
