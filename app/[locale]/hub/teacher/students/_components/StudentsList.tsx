"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyResults } from "@/components/ui/empty";
import { StudentCard, type StudentWithNextClass } from "./StudentCard";
import { motion, AnimatePresence } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";

interface StudentsListProps {
  initialData: StudentWithNextClass[];
}

export function StudentsList({ initialData }: StudentsListProps) {
  const t = useTranslations("MyStudentsPage");
  const [search, setSearch] = useState("");

  const filteredStudents = useMemo(() => {
    if (!search) return initialData;
    const lowerSearch = search.toLowerCase();
    return initialData.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerSearch) ||
        s.email.toLowerCase().includes(lowerSearch)
    );
  }, [initialData, search]);

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <SearchBar
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-card/50 border-none"
        />
      </div>

      <AnimatePresence mode="popLayout">
        {filteredStudents.length > 0 ? (
          <motion.div
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredStudents.map((student) => (
              <motion.div key={student.id} variants={itemVariants} layout>
                <StudentCard student={student} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <EmptyResults 
              searchQuery={search} 
              title={search ? t("noResults") : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
