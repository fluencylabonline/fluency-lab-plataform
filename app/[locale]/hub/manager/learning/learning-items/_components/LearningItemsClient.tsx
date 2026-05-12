"use client";

import { useState } from "react";
import { LanguageWithLessons } from "@/modules/curriculum/curriculum.types";
import { motion, AnimatePresence } from "framer-motion";
import { LearningItemsFilter } from "./LearningItemsFilter";
import { LearningItemsList } from "./LearningItemsList";

interface LearningItemsClientProps {
    initialLanguages: LanguageWithLessons[];
}

export type FilterState = {
    languageId: string;
    type: "VOCABULARY" | "STRUCTURE" | "ALL";
    level: string;
    search: string;
};

export function LearningItemsClient({ initialLanguages }: LearningItemsClientProps) {
    const [filters, setFilters] = useState<FilterState>({
        languageId: initialLanguages[0]?.id || "",
        type: "ALL",
        level: "ALL",
        search: "",
    });

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <LearningItemsFilter 
                    languages={initialLanguages} 
                    filters={filters} 
                    setFilters={setFilters} 
                />
            </motion.div>

            <AnimatePresence mode="wait">
                <LearningItemsList filters={filters} />
            </AnimatePresence>
        </div>
    );
}
