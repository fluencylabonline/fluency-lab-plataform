"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
    const variants = {
        hidden: { x: 30, opacity: 0 },
        enter: { x: 0, opacity: 1 },
    };

    return (
        <motion.div
            variants={variants}
            initial="hidden"
            animate="enter"
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                opacity: { duration: 0.2 }
            }}
            className="flex flex-col flex-1 w-full h-full"
        >
            {children}
        </motion.div>
    );
}